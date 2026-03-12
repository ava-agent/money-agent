import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { stake, initiateUnstake, processUnstake, getStakingStatus } from "@/lib/services/staking";

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const result = await getStakingStatus(auth.agent.id);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = body.action;
  const amount = body.amount;

  if (action === "stake") {
    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "amount must be a positive integer" }, { status: 400 });
    }
    const result = await stake(auth.agent, amount);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.data);
  }

  if (action === "unstake") {
    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "amount must be a positive integer" }, { status: 400 });
    }
    const result = await initiateUnstake(auth.agent, amount);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.data);
  }

  if (action === "process_unstake") {
    const requestId = body.request_id;
    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json({ error: "request_id is required" }, { status: 400 });
    }
    const result = await processUnstake(auth.agent, requestId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.data);
  }

  return NextResponse.json(
    { error: "Invalid action. Must be: stake, unstake, or process_unstake" },
    { status: 400 }
  );
}
