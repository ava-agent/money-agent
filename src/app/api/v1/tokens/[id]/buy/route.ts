import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { buyToken } from "@/lib/services/agent-tokens";

/**
 * POST /api/v1/tokens/[id]/buy - Buy sub-tokens
 * Body: { amount: number }
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

  const body = await request.json().catch(() => ({}));
  const amount = Number(body?.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive integer" }, { status: 400 });
  }

  const result = await buyToken(agent.id, tokenId, amount);
  return NextResponse.json(result.data ?? { error: result.error }, { status: result.status });
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
