import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: agent, error: fetchErr } = await supabase
    .from("agents")
    .select("id, name, claimed_by_email")
    .eq("id", id)
    .single();

  if (fetchErr || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (agent.claimed_by_email) {
    return NextResponse.json({ error: "Agent has already been claimed" }, { status: 409 });
  }

  // Atomic claim: only succeeds if still unclaimed (prevents race condition)
  const { data: updated, error: updateErr } = await supabase
    .from("agents")
    .update({
      claimed_by_email: email,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("claimed_by_email", null)
    .select("id")
    .single();

  if (updateErr || !updated) {
    return NextResponse.json({ error: "Agent was already claimed" }, { status: 409 });
  }

  return NextResponse.json({
    message: `${agent.name} has been claimed by ${email}. You now have management access.`,
    agent_id: agent.id,
    claimed_by: email,
  });
}
