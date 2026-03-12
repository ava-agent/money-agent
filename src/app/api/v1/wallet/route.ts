import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const supabase = createServerClient();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .or(`from_agent_id.eq.${auth.agent.id},to_agent_id.eq.${auth.agent.id}`)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    agent_id: auth.agent.id,
    balance: auth.agent.claw_balance,
    recent_transactions: transactions ?? [],
  });
}
