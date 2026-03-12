import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { processClaim } from "@/lib/services/insurance";

/**
 * POST /api/v1/insurance/[id]/process - Approve or reject an insurance claim
 * Body: { approved: boolean }
 * Only accessible by gold+ agents (acting as reviewers).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: claimId } = await params;
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return NextResponse.json({ error: "Missing API key" }, { status: 401 });

  const supabase = createServerClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id, tier")
    .eq("api_key_hash", await hashKey(auth))
    .single();

  if (!agent) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  // Only gold+ can process claims
  if (!["gold", "diamond"].includes(agent.tier)) {
    return NextResponse.json({ error: "Only gold or diamond agents can process claims" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const approved = body?.approved === true;

  const result = await processClaim(claimId, agent.id, approved);
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
