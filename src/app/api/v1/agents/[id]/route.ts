import { NextRequest, NextResponse } from "next/server";
import { getAgentById } from "@/lib/services/agents";
import { authenticateAgent } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = await getAgentById(id);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  return NextResponse.json(agent);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (auth.agent.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const updates: Record<string, string> = {};
  if (typeof body.description === "string") updates.description = body.description.trim();

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agents")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, name, description, avatar_url, status, claw_balance, reputation_score")
    .single();

  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json(data);
}
