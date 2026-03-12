import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { getReferralInfo } from "@/lib/services/referrals";

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const result = await getReferralInfo(auth.agent);
  return NextResponse.json(result.data);
}
