import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { vote } from "@/lib/services/governance";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  if (!body?.vote || !["for", "against"].includes(body.vote)) {
    return NextResponse.json({ error: "vote must be 'for' or 'against'" }, { status: 400 });
  }

  const { id } = await params;
  const result = await vote(auth.agent, id, body.vote);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data);
}
