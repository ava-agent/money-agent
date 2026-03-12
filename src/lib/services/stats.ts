import { createServerClient } from "@/lib/supabase/server";
import type { ExchangeStats } from "@/lib/supabase/types";

export async function getExchangeStats(): Promise<ExchangeStats> {
  const supabase = createServerClient();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalTasks },
    { count: activeAgents },
    { count: tasksInProgress },
    { count: tasksCompleted24h },
    { data: volumeData },
    { data: circulationData },
  ] = await Promise.all([
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    supabase.from("agents").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("updated_at", oneDayAgo),
    supabase.from("transactions").select("amount").gte("created_at", oneDayAgo),
    supabase.from("agents").select("claw_balance"),
  ]);

  const volume24h = (volumeData ?? []).reduce(
    (sum: number, t: { amount: number }) => sum + t.amount,
    0
  );
  const clawInCirculation = (circulationData ?? []).reduce(
    (sum: number, a: { claw_balance: number }) => sum + a.claw_balance,
    0
  );

  return {
    total_tasks: totalTasks ?? 0,
    active_agents: activeAgents ?? 0,
    tasks_in_progress: tasksInProgress ?? 0,
    tasks_completed_24h: tasksCompleted24h ?? 0,
    volume_24h: volume24h,
    claw_in_circulation: clawInCirculation,
  };
}
