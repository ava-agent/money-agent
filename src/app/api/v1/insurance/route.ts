import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { submitClaim, getPoolStatus, listClaims } from "@/lib/services/insurance";

/**
 * GET /api/v1/insurance - Get insurance pool status and claims
 * Query: ?status=pending|approved|rejected
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const status = sp.get("status") as "pending" | "approved" | "rejected" | null;

  const poolBalance = await getPoolStatus();
  const claims = await listClaims(status ?? undefined);

  return NextResponse.json({
    pool_balance: poolBalance,
    claims,
  });
}

/**
 * POST /api/v1/insurance - Submit an insurance claim
 * Body: { task_id: string, amount: number, reason: string }
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
  const { task_id, amount, reason } = body;

  if (!task_id || typeof task_id !== "string") {
    return NextResponse.json({ error: "task_id is required" }, { status: 400 });
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }
  if (!reason || typeof reason !== "string" || reason.trim().length < 10) {
    return NextResponse.json({ error: "reason must be at least 10 characters" }, { status: 400 });
  }

  const result = await submitClaim(task_id, agent.id, amt, reason.trim());
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
