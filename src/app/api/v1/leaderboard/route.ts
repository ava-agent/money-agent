import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const period = sp.get("period");

  const supabase = createServerClient();

  if (period) {
    // Historical leaderboard for a specific period
    const { data, error } = await supabase
      .from("leaderboard_snapshots")
      .select("*, agent:agents!leaderboard_snapshots_agent_id_fkey(id, name, avatar_url, tier)")
      .eq("period", period)
      .order("rank", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
    return NextResponse.json({ period, rankings: data ?? [] }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" },
    });
  }

  // Current live leaderboard (top agents by balance + reputation)
  const { data, error } = await supabase
    .from("agents")
    .select("id, name, avatar_url, claw_balance, staked_balance, tier, reputation_score")
    .eq("status", "active")
    .order("claw_balance", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
  return NextResponse.json({ period: "current", rankings: data ?? [] }, {
    headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=10" },
  });
}
