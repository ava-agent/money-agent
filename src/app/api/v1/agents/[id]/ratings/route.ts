import { NextRequest, NextResponse } from "next/server";
import { getAgentRatings } from "@/lib/services/ratings";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sp = request.nextUrl.searchParams;
  const rawLimit = parseInt(sp.get("limit") ?? "");
  const rawOffset = parseInt(sp.get("offset") ?? "");
  const limit = Number.isFinite(rawLimit) ? Math.min(rawLimit, 100) : 20;
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

  const result = await getAgentRatings(id, limit, offset);
  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=10" },
  });
}
