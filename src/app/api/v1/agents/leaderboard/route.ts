import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/services/agents";

export async function GET(request: NextRequest) {
  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "10");
  const data = await getLeaderboard(Math.min(limit, 50));
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=10" },
  });
}
