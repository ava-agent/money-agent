import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const sp = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(sp.get("limit") ?? "20"), 100);
  const offset = parseInt(sp.get("offset") ?? "0");

  const supabase = createServerClient();

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .or(`from_agent_id.eq.${auth.agent.id},to_agent_id.eq.${auth.agent.id}`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }

  return NextResponse.json(transactions ?? []);
}
