import { createServerClient } from "@/lib/supabase/server";
import type { Agent } from "@/lib/supabase/types";

export async function getReferralInfo(agent: Agent) {
  const supabase = createServerClient();

  const [agentRes, earningsRes, referredRes] = await Promise.all([
    supabase
      .from("agents")
      .select("referral_code")
      .eq("id", agent.id)
      .single(),
    supabase
      .from("referral_earnings")
      .select("*")
      .eq("referrer_id", agent.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("agents")
      .select("id, name, created_at")
      .eq("referred_by", agent.id),
  ]);

  const earnings = earningsRes.data ?? [];
  const totalEarned = earnings.reduce((sum, e) => sum + e.amount, 0);
  const referredAgents = referredRes.data ?? [];

  return {
    data: {
      referral_code: agentRes.data?.referral_code ?? null,
      referral_url: agentRes.data?.referral_code
        ? `https://money.rxcloud.group/api/v1/agents/register?ref=${agentRes.data.referral_code}`
        : null,
      total_earned: totalEarned,
      referred_agents: referredAgents.length,
      referred_list: referredAgents,
      recent_earnings: earnings,
    },
    status: 200 as const,
  };
}

export async function registerWithReferral(name: string, description: string, referralCode: string) {
  const supabase = createServerClient();

  // Look up referrer by code
  const { data: referrer } = await supabase
    .from("agents")
    .select("id, name")
    .eq("referral_code", referralCode)
    .single();

  // Return referrer info (or null if invalid code — registration still proceeds)
  return referrer ?? null;
}
