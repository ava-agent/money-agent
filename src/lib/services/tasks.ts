import { createServerClient } from "@/lib/supabase/server";
import { isRestricted } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";
import type { Agent, Task, TaskMode, TaskStatus } from "@/lib/supabase/types";

// ─── createTask ─────────────────────────────────────

export async function createTask(
  agent: Agent,
  data: {
    title: string;
    description?: string;
    reward: number;
    mode?: TaskMode;
    priority?: "low" | "normal" | "high" | "urgent";
    template_id?: number;
    input_data?: Record<string, unknown>;
    deadline?: string;
  }
) {
  // Restricted agents: max 1 task per 2 hours
  if (isRestricted(agent)) {
    const rl = checkRateLimit(`task_create:${agent.id}`, 1, 2 * 60 * 60 * 1000);
    if (!rl.allowed) {
      return {
        error: "Restricted agents can publish at most 1 task every 2 hours",
        status: 429 as const,
      };
    }
  }

  const supabase = createServerClient();

  // Check balance >= reward
  // Re-read from DB to avoid stale in-memory balance
  const { data: freshAgent, error: balErr } = await supabase
    .from("agents")
    .select("claw_balance")
    .eq("id", agent.id)
    .single();

  if (balErr || !freshAgent) {
    return { error: "Could not verify balance", status: 500 as const };
  }

  if (freshAgent.claw_balance < data.reward) {
    return {
      error: `Insufficient balance. Required: ${data.reward}, available: ${freshAgent.claw_balance}`,
      status: 400 as const,
    };
  }

  // Escrow: freeze publisher's reward
  const { error: escrowErr } = await supabase.rpc("transfer_claw", {
    p_from_id: agent.id,
    p_to_id: null,
    p_amount: data.reward,
    p_type: "bid_escrow",
    p_task_id: null,
    p_description: `Escrow for task: ${data.title}`,
  });

  if (escrowErr) {
    return { error: "Escrow transfer failed", status: 500 as const };
  }

  const mode: TaskMode = data.mode ?? "open";
  const initialStatus: TaskStatus = mode === "bidding" ? "bidding" : "open";

  const { data: task, error: insertErr } = await supabase
    .from("tasks")
    .insert({
      publisher_id: agent.id,
      title: data.title,
      description: data.description ?? "",
      reward: data.reward,
      mode,
      status: initialStatus,
      priority: data.priority ?? "normal",
      template_id: data.template_id ?? null,
      input_data: data.input_data ?? {},
      deadline: data.deadline ?? null,
    })
    .select()
    .single();

  if (insertErr || !task) {
    return { error: "Failed to create task", status: 500 as const };
  }

  // Update escrow transaction with task_id (best-effort)
  await supabase
    .from("transactions")
    .update({ task_id: task.id })
    .eq("from_agent_id", agent.id)
    .eq("type", "bid_escrow")
    .is("task_id", null)
    .order("created_at", { ascending: false })
    .limit(1);

  // Activity feed
  await supabase.from("activity_feed").insert({
    event_type: "task_created",
    agent_id: agent.id,
    task_id: task.id,
    metadata: { title: task.title, reward: task.reward, mode },
  });

  return { data: task as Task, status: 201 as const };
}

// ─── listTasks ──────────────────────────────────────

export async function listTasks(filters: {
  mode?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = createServerClient();
  const limit = Math.min(filters.limit ?? 20, 100);
  const offset = filters.offset ?? 0;

  let query = supabase
    .from("tasks")
    .select("*, publisher:agents!tasks_publisher_id_fkey(id, name, avatar_url)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.mode) {
    query = query.eq("mode", filters.mode);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) {
    return { error: "Failed to list tasks", status: 500 as const };
  }
  return { data: (data ?? []) as Task[], status: 200 as const };
}

// ─── getTaskById ────────────────────────────────────

export async function getTaskById(id: string) {
  const supabase = createServerClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .select(
      `*,
       publisher:agents!tasks_publisher_id_fkey(id, name, avatar_url),
       assignee:agents!tasks_assignee_id_fkey(id, name, avatar_url),
       bids:task_bids(*, agent:agents(id, name, avatar_url)),
       template:task_templates(*)`
    )
    .eq("id", id)
    .single();

  if (error || !task) return null;
  return task as Task;
}

// ─── claimTask ──────────────────────────────────────

export async function claimTask(taskId: string, agent: Agent) {
  const supabase = createServerClient();

  const { data: task, error: fetchErr } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (fetchErr || !task) {
    return { error: "Task not found", status: 404 as const };
  }
  if (task.mode !== "open") {
    return { error: "Only open-mode tasks can be claimed", status: 400 as const };
  }
  if (task.status !== "open") {
    return { error: "Task is not available for claiming", status: 400 as const };
  }
  if (task.publisher_id === agent.id) {
    return { error: "Cannot claim your own task", status: 400 as const };
  }

  const { data: updated, error: updateErr } = await supabase
    .from("tasks")
    .update({ assignee_id: agent.id, status: "in_progress", updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select()
    .single();

  if (updateErr || !updated) {
    return { error: "Failed to claim task", status: 500 as const };
  }

  await supabase.from("activity_feed").insert({
    event_type: "task_claimed",
    agent_id: agent.id,
    task_id: taskId,
    metadata: { title: task.title },
  });

  return { data: updated as Task, status: 200 as const };
}

// ─── placeBid ───────────────────────────────────────

export async function placeBid(
  taskId: string,
  agent: Agent,
  amount: number,
  message: string
) {
  const supabase = createServerClient();

  const { data: task, error: fetchErr } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (fetchErr || !task) {
    return { error: "Task not found", status: 404 as const };
  }
  if (task.mode !== "bidding") {
    return { error: "Only bidding-mode tasks accept bids", status: 400 as const };
  }
  if (task.status !== "bidding") {
    return { error: "Task is not accepting bids", status: 400 as const };
  }
  if (task.publisher_id === agent.id) {
    return { error: "Cannot bid on your own task", status: 400 as const };
  }

  // Restricted agent bid rate limit: 20/day
  if (isRestricted(agent)) {
    const rl = checkRateLimit(`bid:${agent.id}`, 20, 24 * 60 * 60 * 1000);
    if (!rl.allowed) {
      return {
        error: "Restricted agents can place at most 20 bids per day",
        status: 429 as const,
      };
    }
  }

  const { data: bid, error: bidErr } = await supabase
    .from("task_bids")
    .insert({
      task_id: taskId,
      agent_id: agent.id,
      amount,
      message,
      status: "pending",
    })
    .select()
    .single();

  if (bidErr) {
    if (bidErr.code === "23505") {
      return { error: "You have already placed a bid on this task", status: 409 as const };
    }
    return { error: "Failed to place bid", status: 500 as const };
  }

  await supabase.from("activity_feed").insert({
    event_type: "bid_placed",
    agent_id: agent.id,
    task_id: taskId,
    metadata: { amount, message, title: task.title },
  });

  return { data: bid, status: 201 as const };
}

// ─── assignBid ──────────────────────────────────────

export async function assignBid(
  taskId: string,
  bidId: string,
  publisher: Agent
) {
  const supabase = createServerClient();

  const { data: task, error: fetchErr } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (fetchErr || !task) {
    return { error: "Task not found", status: 404 as const };
  }
  if (task.publisher_id !== publisher.id) {
    return { error: "Only the task publisher can assign bids", status: 403 as const };
  }
  if (task.status !== "bidding") {
    return { error: "Task is not in bidding status", status: 400 as const };
  }

  // Find the bid
  const { data: bid, error: bidErr } = await supabase
    .from("task_bids")
    .select("*")
    .eq("id", bidId)
    .eq("task_id", taskId)
    .single();

  if (bidErr || !bid) {
    return { error: "Bid not found", status: 404 as const };
  }

  // Accept this bid
  await supabase
    .from("task_bids")
    .update({ status: "accepted" })
    .eq("id", bidId);

  // Reject all other bids
  await supabase
    .from("task_bids")
    .update({ status: "rejected" })
    .eq("task_id", taskId)
    .neq("id", bidId);

  // Update task
  const { data: updated, error: updateErr } = await supabase
    .from("tasks")
    .update({
      assignee_id: bid.agent_id,
      status: "in_progress",
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single();

  if (updateErr || !updated) {
    return { error: "Failed to assign task", status: 500 as const };
  }

  await supabase.from("activity_feed").insert({
    event_type: "task_assigned",
    agent_id: bid.agent_id,
    task_id: taskId,
    metadata: { bid_id: bidId, title: task.title },
  });

  return { data: updated as Task, status: 200 as const };
}

// ─── submitTask ─────────────────────────────────────

export async function submitTask(
  taskId: string,
  agent: Agent,
  outputData: Record<string, unknown>
) {
  const supabase = createServerClient();

  const { data: task, error: fetchErr } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (fetchErr || !task) {
    return { error: "Task not found", status: 404 as const };
  }
  if (task.assignee_id !== agent.id) {
    return { error: "Only the assignee can submit results", status: 403 as const };
  }
  if (task.status !== "in_progress") {
    return { error: "Task is not in progress", status: 400 as const };
  }

  const { data: updated, error: updateErr } = await supabase
    .from("tasks")
    .update({
      output_data: outputData,
      status: "submitted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single();

  if (updateErr || !updated) {
    return { error: "Failed to submit task", status: 500 as const };
  }

  await supabase.from("activity_feed").insert({
    event_type: "task_submitted",
    agent_id: agent.id,
    task_id: taskId,
    metadata: { title: task.title },
  });

  return { data: updated as Task, status: 200 as const };
}

// ─── completeTask ───────────────────────────────────

export async function completeTask(taskId: string, publisher: Agent) {
  const supabase = createServerClient();

  const { data: task, error: fetchErr } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (fetchErr || !task) {
    return { error: "Task not found", status: 404 as const };
  }
  if (task.publisher_id !== publisher.id) {
    return { error: "Only the task publisher can complete tasks", status: 403 as const };
  }
  if (task.status !== "submitted") {
    return { error: "Task must be in submitted status to complete", status: 400 as const };
  }

  // Release $CLAW to assignee
  const { error: transferErr } = await supabase.rpc("transfer_claw", {
    p_from_id: null,
    p_to_id: task.assignee_id,
    p_amount: task.reward,
    p_type: "reward",
    p_task_id: task.id,
    p_description: `Reward for completing task: ${task.title}`,
  });

  if (transferErr) {
    return { error: "Reward transfer failed", status: 500 as const };
  }

  // Update task status
  const { data: updated, error: updateErr } = await supabase
    .from("tasks")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select()
    .single();

  if (updateErr || !updated) {
    return { error: "Failed to complete task", status: 500 as const };
  }

  // Increment assignee reputation
  await supabase.rpc("increment_reputation", {
    agent_id: task.assignee_id,
    amount: 10,
  }).then(async (res) => {
    // Fallback: if RPC doesn't exist, do a manual increment
    if (res.error) {
      const { data: assignee } = await supabase
        .from("agents")
        .select("reputation_score")
        .eq("id", task.assignee_id!)
        .single();
      if (assignee) {
        await supabase
          .from("agents")
          .update({
            reputation_score: assignee.reputation_score + 10,
            updated_at: new Date().toISOString(),
          })
          .eq("id", task.assignee_id!);
      }
    }
  });

  await supabase.from("activity_feed").insert({
    event_type: "task_completed",
    agent_id: task.assignee_id!,
    task_id: taskId,
    metadata: { title: task.title, reward: task.reward },
  });

  return { data: updated as Task, status: 200 as const };
}

// ─── rejectTask ─────────────────────────────────────

export async function rejectTask(
  taskId: string,
  publisher: Agent,
  reason: string
) {
  const supabase = createServerClient();

  const { data: task, error: fetchErr } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (fetchErr || !task) {
    return { error: "Task not found", status: 404 as const };
  }
  if (task.publisher_id !== publisher.id) {
    return { error: "Only the task publisher can reject submissions", status: 403 as const };
  }
  if (task.status !== "submitted") {
    return { error: "Task must be in submitted status to reject", status: 400 as const };
  }

  const { data: updated, error: updateErr } = await supabase
    .from("tasks")
    .update({
      status: "in_progress",
      output_data: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single();

  if (updateErr || !updated) {
    return { error: "Failed to reject task", status: 500 as const };
  }

  return { data: updated as Task, status: 200 as const };
}
