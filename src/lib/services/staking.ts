import { createServerClient } from "@/lib/supabase/server";
import type { Agent } from "@/lib/supabase/types";

// ─── stake ──────────────────────────────────────────

export async function stake(agent: Agent, amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: "Amount must be a positive integer", status: 400 as const };
  }

  const supabase = createServerClient();

  const { data: result, error } = await supabase.rpc("stake_claw", {
    p_agent_id: agent.id,
    p_amount: amount,
  });

  if (error || !result?.success) {
    const errMsg = result?.error === "insufficient_balance"
      ? `Insufficient balance. Available: ${result.available}, requested: ${result.requested}`
      : result?.error ?? "Staking failed";
    return { error: errMsg, status: 400 as const };
  }

  return { data: result, status: 200 as const };
}

// ─── initiateUnstake ────────────────────────────────

export async function initiateUnstake(agent: Agent, amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: "Amount must be a positive integer", status: 400 as const };
  }

  const supabase = createServerClient();

  const { data: result, error } = await supabase.rpc("initiate_unstake", {
    p_agent_id: agent.id,
    p_amount: amount,
  });

  if (error || !result?.success) {
    const errMsg = result?.error === "insufficient_staked"
      ? `Insufficient staked balance. Available to unstake: ${result.available_to_unstake}, requested: ${result.requested}`
      : result?.error ?? "Unstake initiation failed";
    return { error: errMsg, status: 400 as const };
  }

  return { data: result, status: 200 as const };
}

// ─── processUnstake ─────────────────────────────────

export async function processUnstake(agent: Agent, requestId: string) {
  const supabase = createServerClient();

  // Verify the request belongs to this agent
  const { data: req, error: fetchErr } = await supabase
    .from("unstake_requests")
    .select("*")
    .eq("id", requestId)
    .eq("agent_id", agent.id)
    .single();

  if (fetchErr || !req) {
    return { error: "Unstake request not found", status: 404 as const };
  }

  const { data: result, error } = await supabase.rpc("process_unstake", {
    p_request_id: requestId,
  });

  if (error || !result?.success) {
    const errMsg = result?.error === "cooldown_not_expired"
      ? `Cooldown not expired. Release at: ${result.release_at}`
      : result?.error === "has_active_tasks"
      ? `Cannot unstake while you have ${result.count} active task(s)`
      : result?.error ?? "Unstake processing failed";
    return { error: errMsg, status: 400 as const };
  }

  return { data: result, status: 200 as const };
}

// ─── getStakingStatus ───────────────────────────────

export async function getStakingStatus(agentId: string) {
  const supabase = createServerClient();

  const [agentRes, requestsRes] = await Promise.all([
    supabase
      .from("agents")
      .select("id, name, claw_balance, staked_balance, frozen_balance, tier, reputation_score")
      .eq("id", agentId)
      .single(),
    supabase
      .from("unstake_requests")
      .select("*")
      .eq("agent_id", agentId)
      .eq("status", "pending")
      .order("requested_at", { ascending: false }),
  ]);

  if (agentRes.error || !agentRes.data) {
    return { error: "Agent not found", status: 404 as const };
  }

  const agent = agentRes.data;
  const pendingUnstakes = requestsRes.data ?? [];
  const pendingTotal = pendingUnstakes.reduce((sum, r) => sum + r.amount, 0);

  const feeRates: Record<string, number> = { bronze: 5, silver: 4, gold: 3, diamond: 2 };
  const tierThresholds: Record<string, number> = { bronze: 0, silver: 200, gold: 500, diamond: 1000 };
  const tiers = ["bronze", "silver", "gold", "diamond"] as const;
  const currentIdx = tiers.indexOf(agent.tier as typeof tiers[number]);
  const nextTier = currentIdx < tiers.length - 1 ? tiers[currentIdx + 1] : null;
  const nextThreshold = nextTier ? tierThresholds[nextTier] : null;
  const stakeToNextTier = nextThreshold ? Math.max(nextThreshold - agent.staked_balance, 0) : null;

  return {
    data: {
      tier: agent.tier,
      staked_balance: agent.staked_balance,
      available_balance: agent.claw_balance,
      frozen_balance: agent.frozen_balance,
      fee_rate: `${feeRates[agent.tier] ?? 5}%`,
      reputation: agent.reputation_score,
      pending_unstakes: pendingUnstakes,
      pending_unstake_total: pendingTotal,
      effective_stake: agent.staked_balance - pendingTotal,
      next_tier: nextTier,
      stake_to_next_tier: stakeToNextTier,
      tier_benefits: getTierBenefits(agent.tier),
    },
    status: 200 as const,
  };
}

function getTierBenefits(tier: string) {
  const benefits: Record<string, object> = {
    bronze: { fee_rate: "5%", bid_limit: "20/day", publish_limit: "1 per 2h" },
    silver: { fee_rate: "4%", bid_limit: "50/day", publish_limit: "1 per hour", governance: "can vote" },
    gold: { fee_rate: "3%", bid_limit: "unlimited", publish_limit: "unlimited", governance: "can propose + vote", arbitration: true },
    diamond: { fee_rate: "2%", bid_limit: "unlimited", publish_limit: "unlimited", governance: "full", arbitration: true, staking_bonus: "1.5x", priority_listing: true },
  };
  return benefits[tier] ?? benefits.bronze;
}
