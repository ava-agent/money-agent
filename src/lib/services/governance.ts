import { createServerClient } from "@/lib/supabase/server";
import type { Agent } from "@/lib/supabase/types";

export async function createProposal(
  agent: Agent,
  data: { title: string; description: string; proposal_type: string }
) {
  const validTypes = ["normal", "parameter", "major"];
  if (!validTypes.includes(data.proposal_type)) {
    return { error: `Invalid type. Must be: ${validTypes.join(", ")}`, status: 400 as const };
  }
  if (!data.title || data.title.length < 5) {
    return { error: "Title must be at least 5 characters", status: 400 as const };
  }
  if (!data.description || data.description.length < 20) {
    return { error: "Description must be at least 20 characters", status: 400 as const };
  }

  const supabase = createServerClient();

  const { data: result, error } = await supabase.rpc("create_proposal", {
    p_agent_id: agent.id,
    p_title: data.title.trim(),
    p_description: data.description.trim(),
    p_proposal_type: data.proposal_type,
  });

  if (error || !result?.success) {
    const errMsg = result?.error === "tier_too_low"
      ? `Gold tier required to propose. Current: ${result.current}`
      : result?.error === "insufficient_stake"
      ? `Must stake >= 500 $CLAW. Current: ${result.current}`
      : result?.error === "insufficient_balance"
      ? `Need ${result.required} $CLAW for proposal fee. Available: ${result.available}`
      : result?.error ?? "Failed to create proposal";
    return { error: errMsg, status: 400 as const };
  }

  return { data: result, status: 201 as const };
}

export async function vote(agent: Agent, proposalId: string, voteChoice: string) {
  if (!["for", "against"].includes(voteChoice)) {
    return { error: "Vote must be 'for' or 'against'", status: 400 as const };
  }

  const supabase = createServerClient();

  const { data: result, error } = await supabase.rpc("cast_vote", {
    p_agent_id: agent.id,
    p_proposal_id: proposalId,
    p_vote: voteChoice,
  });

  if (error || !result?.success) {
    const errMsg = result?.error === "tier_too_low"
      ? `Silver tier required to vote. Current: ${result.current}`
      : result?.error === "already_voted"
      ? "You have already voted on this proposal"
      : result?.error === "still_in_discussion"
      ? `Voting starts at ${result.voting_starts}`
      : result?.error === "voting_ended"
      ? `Voting ended at ${result.ended_at}`
      : result?.error ?? "Failed to cast vote";
    return { error: errMsg, status: 400 as const };
  }

  return { data: result, status: 200 as const };
}

export async function finalizeProposal(proposalId: string) {
  const supabase = createServerClient();

  const { data: result, error } = await supabase.rpc("finalize_proposal", {
    p_proposal_id: proposalId,
  });

  if (error || !result?.success) {
    return { error: result?.error ?? "Failed to finalize proposal", status: 400 as const };
  }

  return { data: result, status: 200 as const };
}

export async function listProposals(filters: { status?: string; limit?: number; offset?: number }) {
  const supabase = createServerClient();
  const limit = Math.min(filters.limit ?? 20, 100);
  const offset = Math.max(filters.offset ?? 0, 0);

  let query = supabase
    .from("proposals")
    .select("*, proposer:agents!proposals_proposer_id_fkey(id, name, avatar_url, tier)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) {
    return { error: "Failed to list proposals", status: 500 as const };
  }
  return { data: data ?? [], status: 200 as const };
}

export async function getProposal(proposalId: string) {
  const supabase = createServerClient();

  const [propRes, votesRes] = await Promise.all([
    supabase
      .from("proposals")
      .select("*, proposer:agents!proposals_proposer_id_fkey(id, name, avatar_url, tier)")
      .eq("id", proposalId)
      .single(),
    supabase
      .from("proposal_votes")
      .select("*, voter:agents!proposal_votes_voter_id_fkey(id, name, tier)")
      .eq("proposal_id", proposalId)
      .order("created_at", { ascending: false }),
  ]);

  if (propRes.error || !propRes.data) {
    return { error: "Proposal not found", status: 404 as const };
  }

  return {
    data: {
      ...propRes.data,
      votes: votesRes.data ?? [],
    },
    status: 200 as const,
  };
}
