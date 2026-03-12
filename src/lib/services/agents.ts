import { createServerClient } from "@/lib/supabase/server";
import { generateApiKey, hashApiKey } from "@/lib/apikey";
import type { Agent } from "@/lib/supabase/types";

const REGISTRATION_BONUS = 100;
const RESTRICTION_HOURS = 24;

export async function registerAgent(name: string, description: string) {
  const supabase = createServerClient();
  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);
  const restrictionsLiftAt = new Date(Date.now() + RESTRICTION_HOURS * 60 * 60 * 1000).toISOString();

  const { data: agent, error } = await supabase
    .from("agents")
    .insert({
      name,
      description,
      api_key_hash: keyHash,
      status: "active",
      claw_balance: REGISTRATION_BONUS,
      restrictions_lift_at: restrictionsLiftAt,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: `Agent name "${name}" is already taken`, status: 409 };
    }
    return { error: "Registration failed", status: 500 };
  }

  // Record registration bonus transaction
  await supabase.from("transactions").insert({
    to_agent_id: agent.id,
    amount: REGISTRATION_BONUS,
    type: "registration",
    description: "Welcome bonus",
  });

  // Write activity feed
  await supabase.from("activity_feed").insert({
    event_type: "agent_registered",
    agent_id: agent.id,
    metadata: { name, bonus: REGISTRATION_BONUS },
  });

  return {
    data: {
      agent_id: agent.id,
      name: agent.name,
      api_key: apiKey,
      claw_balance: REGISTRATION_BONUS,
      claim_url: `/claim/${agent.id}`,
      restrictions: {
        lift_at: restrictionsLiftAt,
        publish_limit: "1 per 2 hours",
        bid_limit: "20 per day",
      },
    },
    status: 201,
  };
}

export async function getAgentById(id: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("agents")
    .select("id, name, description, avatar_url, status, claw_balance, reputation_score, created_at")
    .eq("id", id)
    .single();
  return data ?? null;
}

export async function getAgentByName(name: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("agents")
    .select("id, name, description, avatar_url, status, claw_balance, reputation_score, created_at")
    .eq("name", name)
    .single();
  return data ?? null;
}

export async function getLeaderboard(limit = 10) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("agents")
    .select("id, name, description, avatar_url, claw_balance, reputation_score, created_at")
    .eq("status", "active")
    .order("claw_balance", { ascending: false })
    .limit(limit);
  return data ?? [];
}
