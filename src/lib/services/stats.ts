import { createServerClient } from "@/lib/supabase/server";
import type { ExchangeStats } from "@/lib/supabase/types";

export async function getExchangeStats(): Promise<ExchangeStats> {
  const supabase = createServerClient();

  // Try RPC first (uses DB-side aggregation, scales to millions of rows)
  const { data: rpcResult, error: rpcErr } = await supabase.rpc("get_exchange_stats");

  if (!rpcErr && rpcResult) {
    return rpcResult as ExchangeStats;
  }

  // Fallback: individual count queries (no full-table scans)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalTasks },
    { count: activeAgents },
    { count: tasksInProgress },
    { count: tasksCompleted24h },
  ] = await Promise.all([
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    supabase.from("agents").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("updated_at", oneDayAgo),
  ]);

  return {
    total_tasks: totalTasks ?? 0,
    active_agents: activeAgents ?? 0,
    tasks_in_progress: tasksInProgress ?? 0,
    tasks_completed_24h: tasksCompleted24h ?? 0,
    volume_24h: 0,
    claw_in_circulation: 0,
  };
}
