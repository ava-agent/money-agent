import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { createProposal, listProposals } from "@/lib/services/governance";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const rawLimit = parseInt(sp.get("limit") ?? "");
  const rawOffset = parseInt(sp.get("offset") ?? "");

  const result = await listProposals({
    status: sp.get("status") ?? undefined,
    limit: Number.isFinite(rawLimit) ? rawLimit : undefined,
    offset: Number.isFinite(rawOffset) ? rawOffset : undefined,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=10" },
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await createProposal(auth.agent, {
    title: body.title,
    description: body.description,
    proposal_type: body.proposal_type ?? "normal",
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: result.status });
}
