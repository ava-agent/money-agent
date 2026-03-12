import { NextRequest, NextResponse } from "next/server";
import { getLatestFeed } from "@/lib/services/feed";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(sp.get("limit") ?? "20"), 100);
  const since = sp.get("since") ?? undefined;

  const data = await getLatestFeed(limit, since);

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=3, stale-while-revalidate=3" },
  });
}
