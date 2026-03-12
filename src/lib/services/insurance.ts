import { createServerClient } from "@/lib/supabase/server";

/**
 * Fund the insurance pool from treasury.
 */
export async function fundPool(amount: number) {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("fund_insurance_pool", {
    p_amount: amount,
  });
  if (error) return { error: "Funding failed", status: 500 as const };
  if (!data?.success) return { error: data?.error ?? "Unknown error", status: 400 as const };
  return { data, status: 200 as const };
}

/**
 * Submit an insurance claim for a failed/disputed task.
 */
export async function submitClaim(taskId: string, claimantId: string, amount: number, reason: string) {
  const supabase = createServerClient();

  // Verify task exists and claimant is involved
  const { data: task } = await supabase
    .from("tasks")
    .select("id, status, publisher_id, assignee_id")
    .eq("id", taskId)
    .single();

  if (!task) return { error: "Task not found", status: 404 as const };
  if (task.publisher_id !== claimantId && task.assignee_id !== claimantId) {
    return { error: "Not authorized to claim this task", status: 403 as const };
  }
  if (task.status !== "failed" && task.status !== "expired") {
    return { error: "Can only claim insurance for failed/expired tasks", status: 400 as const };
  }

  // Check for existing claim
  const { data: existing } = await supabase
    .from("insurance_claims")
    .select("id")
    .eq("task_id", taskId)
    .eq("claimant_id", claimantId)
    .eq("status", "pending")
    .single();

  if (existing) return { error: "Pending claim already exists", status: 409 as const };

  const { data: claim, error } = await supabase
    .from("insurance_claims")
    .insert({
      task_id: taskId,
      claimant_id: claimantId,
      amount,
      reason,
      status: "pending",
    })
    .select()
    .single();

  if (error) return { error: "Failed to submit claim", status: 500 as const };
  return { data: claim, status: 201 as const };
}

/**
 * Process (approve/reject) an insurance claim. Requires admin/governance authority.
 */
export async function processClaim(claimId: string, reviewerId: string, approved: boolean) {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("process_insurance_claim", {
    p_claim_id: claimId,
    p_reviewer_id: reviewerId,
    p_approved: approved,
  });
  if (error) return { error: "Processing failed", status: 500 as const };
  if (!data?.success) return { error: data?.error ?? "Unknown error", status: 400 as const };
  return { data, status: 200 as const };
}

/**
 * Get insurance pool status.
 */
export async function getPoolStatus() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("platform_state")
    .select("insurance_pool_balance")
    .single();
  return data?.insurance_pool_balance ?? 0;
}

/**
 * List claims (optionally filtered by status).
 */
export async function listClaims(status?: "pending" | "approved" | "rejected", limit = 20) {
  const supabase = createServerClient();
  let query = supabase
    .from("insurance_claims")
    .select("*, claimant:agents!insurance_claims_claimant_id_fkey(id, name), task:tasks(id, title)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);

  const { data } = await query;
  return data ?? [];
}
