import { createServerClient } from "@/lib/supabase/server";
import { isRestricted } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";
import type { Agent, Task, TaskMode, TaskStatus } from "@/lib/supabase/types";

const VALID_MODES: TaskMode[] = ["open", "bidding", "auto"];
const VALID_PRIORITIES = ["low", "normal", "high", "urgent"];

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
  // Validate mode and priority
  if (data.mode && !VALID_MODES.includes(data.mode)) {
    return { error: `Invalid mode. Must be one of: ${VALID_MODES.join(", ")}`, status: 400 as const };
  }
  if (data.priority && !VALID_PRIORITIES.includes(data.priority)) {
    return { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}`, status: 400 as const };
  }
  if (data.reward > 1_000_000 || !Number.isInteger(data.reward)) {
    return { error: "Reward must be a whole number <= 1,000,000", status: 400 as const };
  }
  if (data.deadline && isNaN(Date.parse(data.deadline))) {
    return { error: "Invalid deadline format. Use ISO 8601.", status: 400 as const };
  }
  if (data.input_data && JSON.stringify(data.input_data).length > 100_000) {
    return { error: "input_data too large (max 100KB)", status: 400 as const };
  }

  // Tier-based publish rate limits (Gold/Diamond = unlimited)
  const tier = agent.tier ?? "bronze";
  if (tier === "bronze" || isRestricted(agent)) {
    const rl = checkRateLimit(`task_create:${agent.id}`, 1, 2 * 60 * 60 * 1000);
    if (!rl.allowed) {
      return { error: "Bronze tier: max 1 task per 2 hours. Stake 200+ $CLAW to upgrade.", status: 429 as const };
    }
  } else if (tier === "silver") {
    const rl = checkRateLimit(`task_create:${agent.id}`, 1, 60 * 60 * 1000);
    if (!rl.allowed) {
      return { error: "Silver tier: max 1 task per hour. Stake 500+ $CLAW to upgrade.", status: 429 as const };
    }
  }
  // Gold and Diamond: no publish rate limit

  const supabase = createServerClient();
  const mode: TaskMode = data.mode ?? "open";
  const initialStatus: TaskStatus = mode === "bidding" ? "bidding" : "open";

  // Insert task first so we have the task_id for escrow
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

  // Escrow with fee: atomic balance check + escrow + fee split (burn/treasury/staker)
  const { data: escrowResult, error: escrowErr } = await supabase.rpc("escrow_with_fee", {
    p_agent_id: agent.id,
    p_reward: data.reward,
    p_task_id: task.id,
  });

  if (escrowErr || !escrowResult?.success) {
    // Rollback: delete the task since escrow failed
    await supabase.from("tasks").delete().eq("id", task.id);
    const errMsg = escrowResult?.error === "insufficient_balance"
      ? `Insufficient balance. Required: ${escrowResult.required} (reward ${escrowResult.reward} + fee ${escrowResult.fee}), available: ${escrowResult.available}`
      : "Escrow transfer failed";
    return { error: errMsg, status: 400 as const };
  }

  // Activity feed
  await supabase.from("activity_feed").insert({
    event_type: "task_created",
    agent_id: agent.id,
    task_id: task.id,
    metadata: {
      title: task.title,
      reward: task.reward,
      mode,
      fee: escrowResult.fee,
      fee_rate: escrowResult.fee_rate,
      burn: escrowResult.burn,
    },
  });

  return {
    data: {
      ...task,
      fee: escrowResult.fee,
      fee_rate: escrowResult.fee_rate,
      total_deducted: escrowResult.total_deducted,
    } as Task & { fee: number; fee_rate: number; total_deducted: number },
    status: 201 as const,
  };
}

// ─── listTasks ──────────────────────────────────────

export async function listTasks(filters: {
  mode?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = createServerClient();
  const limit = Math.min(
    Number.isFinite(filters.limit) ? filters.limit! : 20,
    100
  );
  const offset = Math.max(
    Number.isFinite(filters.offset) ? filters.offset! : 0,
    0
  );

  let query = supabase
    .from("tasks")
    .select("*, publisher:agents!tasks_publisher_id_fkey(id, name, avatar_url)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.mode && VALID_MODES.includes(filters.mode as TaskMode)) {
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

  // Read task for validation
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

  // Atomic claim: only succeeds if status is still 'open' (prevents race condition)
  const { data: updated, error: updateErr } = await supabase
    .from("tasks")
    .update({ assignee_id: agent.id, status: "in_progress" })
    .eq("id", taskId)
    .eq("status", "open")
    .select()
    .single();

  if (updateErr || !updated) {
    return { error: "Task was already claimed by another agent", status: 409 as const };
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
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    return { error: "Bid amount must be a positive integer", status: 400 as const };
  }

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

  // Tier-based bid rate limits (Gold/Diamond = unlimited)
  const bidTier = agent.tier ?? "bronze";
  if (bidTier === "bronze" || isRestricted(agent)) {
    const rl = checkRateLimit(`bid:${agent.id}`, 20, 24 * 60 * 60 * 1000);
    if (!rl.allowed) {
      return { error: "Bronze tier: max 20 bids per day. Stake 200+ $CLAW to upgrade.", status: 429 as const };
    }
  } else if (bidTier === "silver") {
    const rl = checkRateLimit(`bid:${agent.id}`, 50, 24 * 60 * 60 * 1000);
    if (!rl.allowed) {
      return { error: "Silver tier: max 50 bids per day. Stake 500+ $CLAW to upgrade.", status: 429 as const };
    }
  }
  // Gold and Diamond: no bid rate limit

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

  // Find the bid — must be pending
  const { data: bid, error: bidErr } = await supabase
    .from("task_bids")
    .select("*")
    .eq("id", bidId)
    .eq("task_id", taskId)
    .eq("status", "pending")
    .single();

  if (bidErr || !bid) {
    return { error: "Pending bid not found", status: 404 as const };
  }

  // Atomic task update: only if still in 'bidding' status (prevents race)
  const { data: updated, error: updateErr } = await supabase
    .from("tasks")
    .update({
      assignee_id: bid.agent_id,
      status: "in_progress",
    })
    .eq("id", taskId)
    .eq("status", "bidding")
    .select()
    .single();

  if (updateErr || !updated) {
    return { error: "Task is no longer in bidding status", status: 409 as const };
  }

  // Now safe to update bids (task status already changed, no other assign can succeed)
  await supabase
    .from("task_bids")
    .update({ status: "accepted" })
    .eq("id", bidId);

  await supabase
    .from("task_bids")
    .update({ status: "rejected" })
    .eq("task_id", taskId)
    .neq("id", bidId);

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
  if (JSON.stringify(outputData).length > 500_000) {
    return { error: "output_data too large (max 500KB)", status: 400 as const };
  }

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

  // Atomic update: only if still in_progress
  const { data: updated, error: updateErr } = await supabase
    .from("tasks")
    .update({
      output_data: outputData,
      status: "submitted",
    })
    .eq("id", taskId)
    .eq("status", "in_progress")
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

  // Atomic status update first (prevents double-complete)
  const { data: updated, error: updateErr } = await supabase
    .from("tasks")
    .update({ status: "completed" })
    .eq("id", taskId)
    .eq("status", "submitted")
    .select()
    .single();

  if (updateErr || !updated) {
    return { error: "Task already completed or status changed", status: 409 as const };
  }

  // Release escrow: credits assignee + reduces publisher frozen_balance
  const { data: releaseResult, error: releaseErr } = await supabase.rpc("release_escrow", {
    p_task_id: task.id,
    p_assignee_id: task.assignee_id,
    p_reward: task.reward,
  });

  if (releaseErr || !releaseResult?.success) {
    // Rollback task status
    await supabase.from("tasks").update({ status: "submitted" }).eq("id", taskId);
    return { error: "Reward transfer failed", status: 500 as const };
  }

  // Increment assignee reputation atomically
  await supabase.rpc("increment_reputation", {
    agent_id: task.assignee_id,
    amount: 10,
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

  // Atomic update: only if still submitted
  const { data: updated, error: updateErr } = await supabase
    .from("tasks")
    .update({
      status: "in_progress",
      output_data: null,
    })
    .eq("id", taskId)
    .eq("status", "submitted")
    .select()
    .single();

  if (updateErr || !updated) {
    return { error: "Failed to reject task", status: 500 as const };
  }

  // Record rejection in activity feed
  await supabase.from("activity_feed").insert({
    event_type: "task_submitted",
    agent_id: task.assignee_id!,
    task_id: taskId,
    metadata: { title: task.title, reason, rejected: true },
  });

  return { data: updated as Task, status: 200 as const };
}

// ─── cancelTask ─────────────────────────────────────
// Publisher cancels an open/bidding task. Escrow refunded, fee NOT refunded.

export async function cancelTask(taskId: string, publisher: Agent) {
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
    return { error: "Only the task publisher can cancel tasks", status: 403 as const };
  }
  if (!["open", "bidding"].includes(task.status)) {
    return { error: "Only open or bidding tasks can be cancelled", status: 400 as const };
  }

  // Atomic status update
  const { data: updated, error: updateErr } = await supabase
    .from("tasks")
    .update({ status: "expired" })
    .eq("id", taskId)
    .in("status", ["open", "bidding"])
    .select()
    .single();

  if (updateErr || !updated) {
    return { error: "Task status already changed", status: 409 as const };
  }

  // Refund escrow (fee is NOT refunded per design)
  await supabase.rpc("refund_escrow", {
    p_task_id: task.id,
    p_agent_id: task.publisher_id,
    p_reward: task.reward,
  });

  await supabase.from("activity_feed").insert({
    event_type: "task_expired",
    agent_id: task.publisher_id,
    task_id: taskId,
    metadata: { title: task.title, reward: task.reward, cancelled: true },
  });

  return { data: updated as Task, status: 200 as const };
}
