import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { generateApiKey, hashApiKey } from "@/lib/apikey";
import { createTask, claimTask, submitTask, completeTask } from "@/lib/services/tasks";
import type { Agent, TaskTemplate } from "@/lib/supabase/types";

/**
 * System health check: runs the full task lifecycle with two dedicated agents.
 *
 * Each run picks a random task template and uses ZhipuAI GLM to generate a
 * realistic task (title, description, input_data) and submission (output_data),
 * making every health check unique and more representative of real usage.
 *
 * Flow: pick template → LLM generates task → publish → claim → LLM generates result → submit → complete → verify
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
  template_used?: string;
}

interface GeneratedTask {
  title: string;
  description: string;
  input_data: Record<string, unknown>;
}

interface GeneratedResult {
  output_data: Record<string, unknown>;
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

// ─── LLM Task Generation ─────────────────────────────────────

async function pickRandomTemplate(): Promise<TaskTemplate | null> {
  const supabase = createServerClient();
  const { data: templates } = await supabase
    .from("task_templates")
    .select("*, category:categories(name)")
    .limit(100);

  if (!templates || templates.length === 0) return null;
  return templates[Math.floor(Math.random() * templates.length)] as TaskTemplate;
}

function buildClient(): OpenAI | null {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
  });
}

async function chatJSON(client: OpenAI, prompt: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: "glm-4-flash",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });
  let text = response.choices[0]?.message?.content ?? "";
  // Strip markdown code fences that GLM often wraps around JSON
  text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  return text;
}

async function generateTaskFromTemplate(template: TaskTemplate): Promise<GeneratedTask> {
  const client = buildClient();
  if (!client) {
    return {
      title: `[Auto] ${template.title} #${Date.now().toString(36).slice(-4)}`,
      description: `Automated task based on template: ${template.description}`,
      input_data: { template_slug: template.slug, generated_at: new Date().toISOString() },
    };
  }

  const categoryName = (template as unknown as Record<string, { name?: string }>).category?.name ?? "General";

  const text = await chatJSON(
    client,
    `You are generating a realistic test task for an AI agent platform. Based on this template, create a specific, concrete task instance.

Template: "${template.title}"
Category: ${categoryName}
Description: "${template.description}"
Difficulty: ${template.difficulty}

Return ONLY valid JSON (no markdown, no backticks):
{
  "title": "A specific task title (max 80 chars, do NOT include 'Health Check' or 'Test')",
  "description": "A realistic 1-2 sentence task description",
  "input_data": { "requirements": "...", "deadline_hours": <number>, "priority_note": "..." }
}`
  );

  try {
    const parsed = JSON.parse(text);
    return {
      title: String(parsed.title).slice(0, 80),
      description: String(parsed.description).slice(0, 500),
      input_data: parsed.input_data ?? {},
    };
  } catch {
    return {
      title: `[Auto] ${template.title} #${Date.now().toString(36).slice(-4)}`,
      description: `Automated task: ${template.description}`,
      input_data: { template_slug: template.slug },
    };
  }
}

async function generateTaskResult(taskTitle: string, taskDescription: string): Promise<GeneratedResult> {
  const client = buildClient();
  if (!client) {
    return {
      output_data: {
        status: "completed",
        summary: "Task completed successfully by automated executor.",
        completed_at: new Date().toISOString(),
      },
    };
  }

  const text = await chatJSON(
    client,
    `You are an AI agent that just completed a task. Generate a realistic completion report.

Task: "${taskTitle}"
Description: "${taskDescription}"

Return ONLY valid JSON (no markdown, no backticks):
{
  "status": "completed",
  "summary": "Brief summary of what was done",
  "deliverables": ["list", "of", "outputs"],
  "metrics": { "time_spent_minutes": <number>, "quality_score": <0-100> },
  "completed_at": "${new Date().toISOString()}"
}`
  );

  try {
    return { output_data: JSON.parse(text) };
  } catch {
    return {
      output_data: {
        status: "completed",
        summary: "Task completed successfully.",
        completed_at: new Date().toISOString(),
      },
    };
  }
}

// ─── System Agent Management ─────────────────────────────────

async function ensureSystemAgent(name: string, description: string): Promise<Agent> {
  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("agents")
    .select("*")
    .eq("name", name)
    .single();

  if (existing) {
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

  await supabase.rpc("grant_registration_bonus", { p_agent_id: agent.id });

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

// ─── Main Lifecycle Check ────────────────────────────────────

export async function runLifecycleCheck(): Promise<HealthCheckResult> {
  const totalStart = Date.now();
  const steps: Step[] = [];
  let publisherId: string | undefined;
  let executorId: string | undefined;
  let taskId: string | undefined;
  let templateUsed: string | undefined;
  let publisher: Agent | undefined;
  let executor: Agent | undefined;
  let generatedTask: GeneratedTask | undefined;
  const supabase = createServerClient();

  // ── Step 1: Pick a random template ──
  let template: TaskTemplate | null = null;
  steps.push(
    await runStep("pick_template", async () => {
      template = await pickRandomTemplate();
      if (!template) throw new Error("No templates found in database");
      templateUsed = template.slug;
      return `template="${template.title}" (${template.slug})`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Template selection failed", supabase, publisherId, executorId, taskId, templateUsed);
  }

  // ── Step 2: Generate task content via LLM ──
  steps.push(
    await runStep("generate_task_content", async () => {
      generatedTask = await generateTaskFromTemplate(template!);
      return `title="${generatedTask.title}"`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Task generation failed", supabase, publisherId, executorId, taskId, templateUsed);
  }

  // ── Step 3: Ensure system agents exist ──
  steps.push(
    await runStep("ensure_publisher_agent", async () => {
      publisher = await ensureSystemAgent(SYSTEM_PUBLISHER, "Automated health check publisher");
      publisherId = publisher.id;
      return `id=${publisherId}`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Publisher agent setup failed", supabase, publisherId, executorId, taskId, templateUsed);
  }

  steps.push(
    await runStep("ensure_executor_agent", async () => {
      executor = await ensureSystemAgent(SYSTEM_EXECUTOR, "Automated health check executor");
      executorId = executor.id;
      return `id=${executorId}`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Executor agent setup failed", supabase, publisherId, executorId, taskId, templateUsed);
  }

  // ── Step 4: Ensure publisher has enough balance ──
  steps.push(
    await runStep("ensure_publisher_balance", async () => {
      const bal = await ensureSufficientBalance(publisherId!, HEALTH_REWARD + 5);
      const { data } = await supabase.from("agents").select("*").eq("id", publisherId!).single();
      publisher = data as Agent;
      return `balance=${bal}`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Balance top-up failed", supabase, publisherId, executorId, taskId, templateUsed);
  }

  // ── Step 5: Publish task ──
  steps.push(
    await runStep("publish_task", async () => {
      const result = await createTask(publisher!, {
        title: generatedTask!.title,
        description: generatedTask!.description,
        reward: HEALTH_REWARD,
        mode: "open",
        priority: "low",
        template_id: template!.id,
        input_data: generatedTask!.input_data,
      });

      if ("error" in result) throw new Error(`createTask: ${result.error}`);
      taskId = result.data.id;
      return `task_id=${taskId}`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Task publish failed", supabase, publisherId, executorId, taskId, templateUsed);
  }

  // ── Step 6: Claim task ──
  steps.push(
    await runStep("claim_task", async () => {
      const result = await claimTask(taskId!, executor!);
      if ("error" in result) throw new Error(`claimTask: ${result.error}`);
      return `status=${result.data.status}`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Task claim failed", supabase, publisherId, executorId, taskId, templateUsed);
  }

  // ── Step 7: Generate and submit result via LLM ──
  steps.push(
    await runStep("submit_task", async () => {
      const generated = await generateTaskResult(generatedTask!.title, generatedTask!.description);
      const result = await submitTask(taskId!, executor!, generated.output_data);
      if ("error" in result) throw new Error(`submitTask: ${result.error}`);
      return `status=${result.data.status}`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Task submit failed", supabase, publisherId, executorId, taskId, templateUsed);
  }

  // ── Step 8: Complete task ──
  steps.push(
    await runStep("complete_task", async () => {
      const result = await completeTask(taskId!, publisher!);
      if ("error" in result) throw new Error(`completeTask: ${result.error}`);
      return `status=${result.data.status}`;
    })
  );
  if (steps[steps.length - 1].status === "failed") {
    return finalize("failed", totalStart, steps, "Task complete failed", supabase, publisherId, executorId, taskId, templateUsed);
  }

  // ── Step 9: Verify final state ──
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

  // ── Step 10: Database connectivity ──
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
    taskId,
    templateUsed,
  );
}

// ─── Persistence ─────────────────────────────────────────────

async function finalize(
  status: "passed" | "failed",
  totalStart: number,
  steps: Step[],
  error: string | undefined,
  supabase: ReturnType<typeof createServerClient>,
  publisherId?: string,
  executorId?: string,
  taskId?: string,
  templateUsed?: string,
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

  return { status, duration_ms, steps, error, publisher_id: publisherId, executor_id: executorId, task_id: taskId, template_used: templateUsed };
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
