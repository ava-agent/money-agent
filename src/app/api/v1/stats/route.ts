import { NextResponse } from "next/server";
import { getExchangeStats } from "@/lib/services/stats";

export async function GET() {
  const stats = await getExchangeStats();

  return NextResponse.json(stats, {
    headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=5" },
  });
}
