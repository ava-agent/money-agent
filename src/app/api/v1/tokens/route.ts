import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { issueToken, getAgentToken, getMyHoldings } from "@/lib/services/agent-tokens";

/**
 * POST /api/v1/tokens - Issue a new agent sub-token
 * Body: { symbol: string }
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return NextResponse.json({ error: "Missing API key" }, { status: 401 });

  const supabase = createServerClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("api_key_hash", await hashKey(auth))
    .single();

  if (!agent) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body?.symbol || typeof body.symbol !== "string") {
    return NextResponse.json({ error: "symbol is required (2-10 chars)" }, { status: 400 });
  }
  const symbol = body.symbol.trim().toUpperCase();
  if (symbol.length < 2 || symbol.length > 10) {
    return NextResponse.json({ error: "symbol must be 2-10 characters" }, { status: 400 });
  }

  const result = await issueToken(agent.id, symbol);
  return NextResponse.json(result.data ?? { error: result.error }, { status: result.status });
}

/**
 * GET /api/v1/tokens - List tokens (my holdings or all)
 * Query: ?mine=true or ?agent_id=xxx
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");

  const supabase = createServerClient();

  // If ?mine=true, return my holdings
  if (sp.get("mine") === "true") {
    if (!auth) return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("api_key_hash", await hashKey(auth))
      .single();
    if (!agent) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

    const holdings = await getMyHoldings(agent.id);
    return NextResponse.json({ holdings });
  }

  // If ?agent_id=xxx, return that agent's token info
  const agentId = sp.get("agent_id");
  if (agentId) {
    const token = await getAgentToken(agentId);
    if (!token) return NextResponse.json({ error: "No token found" }, { status: 404 });
    return NextResponse.json({ token });
  }

  // Otherwise list all issued tokens
  const { data: tokens } = await supabase
    .from("agent_tokens")
    .select("id, symbol, agent_id, total_supply, public_sold, price_per_token, status, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return NextResponse.json({ tokens: tokens ?? [] });
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
