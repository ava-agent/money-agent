import { createServerClient } from "@/lib/supabase/server";
import { generateApiKey, hashApiKey } from "@/lib/apikey";
import { createTask, claimTask, submitTask, completeTask } from "@/lib/services/tasks";
import type { Agent } from "@/lib/supabase/types";

/**
 * System health check: runs the full task lifecycle with two dedicated agents.
 *
 * Calls service functions directly (not HTTP) to avoid Vercel deployment protection
 * and to test the actual business logic + database + RPC functions.
 *
 * Flow: ensure agents → top-up balance → createTask → claimTask → submitTask → completeTask → verify
 *
 * Results are stored in the health_checks table for historical tracking.
 */

const SYSTEM_PUBLISHER = "system-health-publisher";
const SYSTEM_EXECUTOR = "system-health-executor";
const HEALTH_REWARD = 10;

interface Step {
  name: string;
  status: "passed" | "failed" | "skipped";
  duration_ms: number;
  detail?: string;
}

interface HealthCheckResult {
  status: "passed" | "failed";
  duration_ms: number;
  steps: Step[];
  error?: string;
  publisher_id?: string;
  executor_id?: string;
  task_id?: string;
}

async function runStep(name: string, fn: () => Promise<string | void>): Promise<Step> {
  const start = Date.now();
  try {
    const detail = await fn();
    return { name, status: "passed", duration_ms: Date.now() - start, detail: detail ?? undefined };
  } catch (err) {
    return { name, status: "failed", duration_ms: Date.now() - start, detail: String(err) };
  }
}

async function ensureSystemAgent(name: string, description: string): Promise<Agent> {
  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("agents")
    .select("*")
    .eq("name", name)
    .single();

  if (existing) {
    // Refresh API key and ensure no restrictions
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);
    await supabase
      .from("agents")
      .update({
        api_key_hash: keyHash,
        status: "active",
        tier: "diamond",
        restrictions_lift_at: null,
      })
      .eq("id", existing.id);
    return { ...existing, tier: "diamond", restrictions_lift_at: null } as Agent;
  }

  // Create new system agent
  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);
  const { data: agent, error } = await supabase
    .from("agents")
    .insert({
      name,
      description,
      api_key_hash: keyHash,
      status: "active",
      claw_balance: 0,
      tier: "diamond",
      restrictions_lift_at: null,
    })
    .select("*")
    .single();

  if (error || !agent) throw new Error(`Failed to create system agent ${name}: ${error?.message}`);

  // Grant registration bonus
  await supabase.rpc("grant_registration_bonus", { p_agent_id: agent.id });

  // Re-fetch to get updated balance
  const { data: updated } = await supabase.from("agents").select("*").eq("id", agent.id).single();
  return updated as Agent;
}

async function ensureSufficientBalance(agentId: string, minBalance: number): Promise<number> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("agents")
    .select("claw_balance")
    .eq("id", agentId)
    .single();

  const balance = data?.claw_balance ?? 0;
  if (balance < minBalance) {
    const topUp = minBalance - balance + 50;
    await supabase
      .from("agents")
      .update({ claw_balance: balance + topUp })
      .eq("id", agentId);

    await supabase.from("transactions").insert({
      to_agent_id: agentId,
      amount: topUp,
      type: "bonus",
      description: "Health check system top-up",
    });

    return balance + topUp;
  }
  return balance;
}

export async function runLifecycleCheck(): Promise<HealthCheckResult> {
  const totalStart = Date.now();
  const steps: Step[] = [];
  let publisherId: string | undefined;
  let executorId: string | undefined;
  let taskId: string | undefined;
  let publisher: Agent | undefined;
  let executor: Agent | undefined;
  const supabase = createServerClient();

  // ── Step 1: Ensure system agents exist ──
  steps.push(
    await runStep("ensure_publisher_agent", async () => {
      publisher = await ensureSystemAgent(SYSTEM_PUBLISHER, "Automated health check publisher");
      publisherId = publisher.id;
      return `id=${publisherId}, balance=${publisher.claw_balance}`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Publisher agent setup failed", supabase, publisherId, executorId, taskId);
  }

  steps.push(
    await runStep("ensure_executor_agent", async () => {
      executor = await ensureSystemAgent(SYSTEM_EXECUTOR, "Automated health check executor");
      executorId = executor.id;
      return `id=${executorId}, balance=${executor.claw_balance}`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Executor agent setup failed", supabase, publisherId, executorId, taskId);
  }

  // ── Step 2: Ensure publisher has enough balance for reward + fee ──
  steps.push(
    await runStep("ensure_publisher_balance", async () => {
      // Diamond tier has 2% fee, so need reward + 2% + buffer
      const bal = await ensureSufficientBalance(publisherId!, HEALTH_REWARD + 5);
      // Re-fetch publisher with updated balance
      const { data } = await supabase.from("agents").select("*").eq("id", publisherId!).single();
      publisher = data as Agent;
      return `balance=${bal}`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Balance top-up failed", supabase, publisherId, executorId, taskId);
  }

  // ── Step 3: Publish task via service layer ──
  steps.push(
    await runStep("publish_task", async () => {
      const result = await createTask(publisher!, {
        title: `[Health Check] ${new Date().toISOString().slice(0, 16)}`,
        description: "Automated lifecycle health check task. Safe to ignore.",
        reward: HEALTH_REWARD,
        mode: "open",
        priority: "low",
      });

      if ("error" in result) throw new Error(`createTask: ${result.error}`);
      taskId = result.data.id;
      return `task_id=${taskId}`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Task publish failed", supabase, publisherId, executorId, taskId);
  }

  // ── Step 4: Claim task ──
  steps.push(
    await runStep("claim_task", async () => {
      const result = await claimTask(taskId!, executor!);
      if ("error" in result) throw new Error(`claimTask: ${result.error}`);
      return `status=${result.data.status}`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Task claim failed", supabase, publisherId, executorId, taskId);
  }

  // ── Step 5: Submit task ──
  steps.push(
    await runStep("submit_task", async () => {
      const result = await submitTask(taskId!, executor!, {
        result: "Health check completed successfully",
        timestamp: new Date().toISOString(),
      });
      if ("error" in result) throw new Error(`submitTask: ${result.error}`);
      return `status=${result.data.status}`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Task submit failed", supabase, publisherId, executorId, taskId);
  }

  // ── Step 6: Complete task (approve + release escrow) ──
  steps.push(
    await runStep("complete_task", async () => {
      const result = await completeTask(taskId!, publisher!);
      if ("error" in result) throw new Error(`completeTask: ${result.error}`);
      return `status=${result.data.status}`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Task complete failed", supabase, publisherId, executorId, taskId);
  }

  // ── Step 7: Verify final state ──
  steps.push(
    await runStep("verify_final_state", async () => {
      const { data: task } = await supabase
        .from("tasks")
        .select("status, assignee_id")
        .eq("id", taskId!)
        .single();

      if (!task || task.status !== "completed") {
        throw new Error(`Expected status=completed, got ${task?.status}`);
      }
      if (task.assignee_id !== executorId) {
        throw new Error(`Expected assignee=${executorId}, got ${task.assignee_id}`);
      }

      const { data: exec } = await supabase
        .from("agents")
        .select("claw_balance, reputation_score")
        .eq("id", executorId!)
        .single();

      return `task=completed, executor_balance=${exec?.claw_balance}, reputation=${exec?.reputation_score}`;
    })
  );

  // ── Step 8: Database connectivity check ──
  steps.push(
    await runStep("database_connectivity", async () => {
      const { count, error } = await supabase
        .from("agents")
        .select("*", { count: "exact", head: true });
      if (error) throw new Error(`DB query failed: ${error.message}`);
      return `agents_count=${count}`;
    })
  );

  const allPassed = steps.every((s) => s.status === "passed");
  return finalize(
    allPassed ? "passed" : "failed",
    totalStart,
    steps,
    allPassed ? undefined : "One or more steps failed",
    supabase,
    publisherId,
    executorId,
    taskId
  );
}

async function finalize(
  status: "passed" | "failed",
  totalStart: number,
  steps: Step[],
  error: string | undefined,
  supabase: ReturnType<typeof createServerClient>,
  publisherId?: string,
  executorId?: string,
  taskId?: string,
): Promise<HealthCheckResult> {
  const duration_ms = Date.now() - totalStart;

  await supabase.from("health_checks").insert({
    status,
    duration_ms,
    steps,
    error: error ?? null,
    publisher_id: publisherId ?? null,
    executor_id: executorId ?? null,
    task_id: taskId ?? null,
  });

  return { status, duration_ms, steps, error, publisher_id: publisherId, executor_id: executorId, task_id: taskId };
}

export async function getHealthCheckHistory(limit = 30) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("health_checks")
    .select("*")
    .order("run_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data ?? [];
}
