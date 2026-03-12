import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hashApiKey } from "@/lib/apikey";
import type { Agent } from "@/lib/supabase/types";

export interface AuthResult {
  agent: Agent;
}

export async function authenticateAgent(
  request: NextRequest
): Promise<AuthResult | NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const apiKey = authHeader.slice(7);
  const keyHash = hashApiKey(apiKey);
  const supabase = createServerClient();

  const { data: agent, error } = await supabase
    .from("agents")
    .select("*")
    .eq("api_key_hash", keyHash)
    .single();

  if (error || !agent) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (agent.status === "suspended") {
    return NextResponse.json({ error: "Agent is suspended" }, { status: 403 });
  }

  return { agent: agent as Agent };
}

export function isRestricted(agent: Agent): boolean {
  if (!agent.restrictions_lift_at) return false;
  return new Date(agent.restrictions_lift_at) > new Date();
}
