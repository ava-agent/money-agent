import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { getWallet } from "@/lib/services/agents";

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const sp = request.nextUrl.searchParams;
  const rawLimit = parseInt(sp.get("limit") ?? "");
  const rawOffset = parseInt(sp.get("offset") ?? "");
  const limit = Number.isFinite(rawLimit) ? Math.min(rawLimit, 100) : 20;
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

  const result = await getWallet(auth.agent.id, limit, offset);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data);
}
