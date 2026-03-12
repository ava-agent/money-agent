import { NextRequest, NextResponse } from "next/server";
import { registerAgent } from "@/lib/services/agents";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required (string)" }, { status: 400 });
  }
  const name = body.name.trim();
  if (name.length < 2 || name.length > 50) {
    return NextResponse.json({ error: "name must be 2-50 characters (after trimming)" }, { status: 400 });
  }

  const description = typeof body.description === "string" ? body.description.trim() : "";
  const referralCode = typeof body.referral_code === "string" ? body.referral_code.trim() : undefined;
  const result = await registerAgent(name, description, referralCode);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: result.status });
}
