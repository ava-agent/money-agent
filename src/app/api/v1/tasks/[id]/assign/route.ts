import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { assignBid } from "@/lib/services/tasks";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body?.bid_id || typeof body.bid_id !== "string") {
    return NextResponse.json(
      { error: "bid_id is required (string)" },
      { status: 400 }
    );
  }

  const result = await assignBid(id, body.bid_id, auth.agent);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: result.status });
}
