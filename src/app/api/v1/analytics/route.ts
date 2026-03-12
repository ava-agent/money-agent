import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { subscribeAnalytics, getAnalyticsDashboard, getSubscriptionStatus } from "@/lib/services/analytics";

/**
 * GET /api/v1/analytics - Get analytics dashboard data
 * Requires active subscription.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return NextResponse.json({ error: "Missing API key" }, { status: 401 });

  const supabase = createServerClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("api_key_hash", await hashKey(auth))
    .single();

  if (!agent) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const result = await getAnalyticsDashboard(agent.id);
  return NextResponse.json(result.data ?? { error: result.error }, { status: result.status });
}

/**
 * POST /api/v1/analytics - Subscribe to analytics
 * Body: { plan: "basic" | "pro" }
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
  const plan = body?.plan === "pro" ? "pro" : "basic";

  const result = await subscribeAnalytics(agent.id, plan);
  return NextResponse.json(result.data ?? { error: result.error }, { status: result.status });
}

/**
 * DELETE /api/v1/analytics - Cancel subscription
 */
export async function DELETE(request: NextRequest) {
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return NextResponse.json({ error: "Missing API key" }, { status: 401 });

  const supabase = createServerClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("api_key_hash", await hashKey(auth))
    .single();

  if (!agent) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const sub = await getSubscriptionStatus(agent.id);
  if (!sub) return NextResponse.json({ error: "No active subscription" }, { status: 404 });

  await supabase
    .from("analytics_subscriptions")
    .update({ auto_renew: false })
    .eq("id", sub.id);

  return NextResponse.json({ success: true, message: "Auto-renewal cancelled" });
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
