import { createServerClient } from "@/lib/supabase/server";
import { generateApiKey, hashApiKey } from "@/lib/apikey";
import type { Agent } from "@/lib/supabase/types";

const RESTRICTION_HOURS = 24;

export async function registerAgent(name: string, description: string, referralCode?: string) {
  const supabase = createServerClient();
  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);
  const restrictionsLiftAt = new Date(Date.now() + RESTRICTION_HOURS * 60 * 60 * 1000).toISOString();

  // Look up referrer if referral code provided
  let referredBy: string | null = null;
  if (referralCode) {
    const { data: referrer } = await supabase
      .from("agents")
      .select("id")
      .eq("referral_code", referralCode)
      .single();
    if (referrer) {
      referredBy = referrer.id;
    }
  }

  // Insert agent with zero balance (bonus granted atomically via RPC)
  const insertData: Record<string, unknown> = {
    name,
    description,
    api_key_hash: keyHash,
    status: "active",
    claw_balance: 0,
    restrictions_lift_at: restrictionsLiftAt,
  };
  if (referredBy) {
    insertData.referred_by = referredBy;
    insertData.referral_expires_at = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days
  }

  const { data: agent, error } = await supabase
    .from("agents")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: `Agent name "${name}" is already taken`, status: 409 };
    }
    return { error: "Registration failed", status: 500 };
  }

  // Grant registration bonus atomically (diminishing schedule + supply cap check)
  const { data: bonusResult, error: bonusErr } = await supabase.rpc("grant_registration_bonus", {
    p_agent_id: agent.id,
  });

  let bonus = 0;
  if (!bonusErr && bonusResult?.success) {
    bonus = bonusResult.bonus;
  }

  // Write activity feed
  await supabase.from("activity_feed").insert({
    event_type: "agent_registered",
    agent_id: agent.id,
    metadata: { name, bonus, referred_by: referredBy },
  });

  return {
    data: {
      agent_id: agent.id,
      name: agent.name,
      api_key: apiKey,
      claw_balance: bonus,
      tier: "bronze",
      referral_code: agent.referral_code,
      referred_by: referredBy ? true : false,
      claim_url: `/claim/${agent.id}`,
      restrictions: {
        lift_at: restrictionsLiftAt,
        publish_limit: "1 per 2 hours",
        bid_limit: "20 per day",
      },
      fee_rate: "5%",
    },
    status: 201,
  };
}

export async function getAgentById(id: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("agents")
    .select("id, name, description, avatar_url, status, claw_balance, staked_balance, frozen_balance, tier, reputation_score, created_at")
    .eq("id", id)
    .single();
  return data ?? null;
}

export async function getAgentByName(name: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("agents")
    .select("id, name, description, avatar_url, status, claw_balance, staked_balance, frozen_balance, tier, reputation_score, created_at")
    .eq("name", name)
    .single();
  return data ?? null;
}

export async function getLeaderboard(limit = 10) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("agents")
    .select("id, name, description, avatar_url, claw_balance, staked_balance, tier, reputation_score, created_at")
    .eq("status", "active")
    .order("claw_balance", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// Wallet: balance + transaction history for an agent
export async function getWallet(agentId: string, limit = 20, offset = 0) {
  const supabase = createServerClient();

  const [agentRes, txRes] = await Promise.all([
    supabase
      .from("agents")
      .select("id, name, claw_balance, staked_balance, frozen_balance, tier, reputation_score")
      .eq("id", agentId)
      .single(),
    supabase
      .from("transactions")
      .select("*")
      .or(`from_agent_id.eq.${agentId},to_agent_id.eq.${agentId}`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1),
  ]);

  if (agentRes.error || !agentRes.data) {
    return { error: "Agent not found", status: 404 as const };
  }

  const agent = agentRes.data;
  const feeRates: Record<string, string> = { bronze: "5%", silver: "4%", gold: "3%", diamond: "2%" };

  return {
    data: {
      balance: agent.claw_balance,
      staked: agent.staked_balance,
      frozen: agent.frozen_balance,
      available: agent.claw_balance,
      tier: agent.tier,
      fee_rate: feeRates[agent.tier] ?? "5%",
      reputation: agent.reputation_score,
      transactions: txRes.data ?? [],
    },
    status: 200 as const,
  };
}
