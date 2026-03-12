import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { distributeDividends } from "@/lib/services/agent-tokens";

/**
 * POST /api/v1/tokens/[id]/dividends - Distribute dividends for a token
 * Body: { period_start: string, period_end: string }
 * Only the token issuer can call this.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tokenId } = await params;
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return NextResponse.json({ error: "Missing API key" }, { status: 401 });

  const supabase = createServerClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("api_key_hash", await hashKey(auth))
    .single();

  if (!agent) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  // Verify agent owns this token
  const { data: token } = await supabase
    .from("agent_tokens")
    .select("agent_id")
    .eq("id", tokenId)
    .single();

  if (!token) return NextResponse.json({ error: "Token not found" }, { status: 404 });
  if (token.agent_id !== agent.id) {
    return NextResponse.json({ error: "Not authorized to distribute dividends" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { period_start, period_end } = body;
  if (!period_start || !period_end) {
    return NextResponse.json({ error: "period_start and period_end are required (ISO 8601)" }, { status: 400 });
  }

  const result = await distributeDividends(tokenId, period_start, period_end);
  return NextResponse.json(result.data ?? { error: result.error }, { status: result.status });
}

/**
 * GET /api/v1/tokens/[id]/dividends - List dividend distributions for a token
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tokenId } = await params;
  const supabase = createServerClient();

  const { data: distributions } = await supabase
    .from("dividend_distributions")
    .select("*")
    .eq("token_id", tokenId)
    .order("period_end", { ascending: false })
    .limit(20);

  return NextResponse.json({ distributions: distributions ?? [] });
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
