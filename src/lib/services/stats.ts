import { createServerClient } from "@/lib/supabase/server";
import type { ExchangeStats, Tokenomics } from "@/lib/supabase/types";

export async function getExchangeStats(): Promise<ExchangeStats & { total_burned: number }> {
  const supabase = createServerClient();

  // Try the enhanced tokenomics RPC first (includes burn data)
  const { data: tokenomics, error: tErr } = await supabase.rpc("get_platform_tokenomics");

  if (!tErr && tokenomics) {
    const t = tokenomics as Tokenomics;
    // Also get task counts from the original stats RPC
    const { data: rpcResult, error: rpcErr } = await supabase.rpc("get_exchange_stats");

    if (!rpcErr && rpcResult) {
      return {
        ...rpcResult,
        claw_in_circulation: t.in_circulation,
        volume_24h: t.volume_24h,
        total_burned: t.total_burned,
      };
    }
  }

  // Fallback to original stats RPC
  const { data: rpcResult, error: rpcErr } = await supabase.rpc("get_exchange_stats");

  if (!rpcErr && rpcResult) {
    return { ...rpcResult, total_burned: 0 } as ExchangeStats & { total_burned: number };
  }

  // Last resort: individual count queries
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
    total_burned: 0,
  };
}
