import { createServerClient } from "@/lib/supabase/server";

/**
 * Subscribe to analytics dashboard (50 $CLAW/mo basic, 100 $CLAW/mo pro).
 * Fee split: 70% burn / 30% treasury.
 */
export async function subscribeAnalytics(agentId: string, plan: "basic" | "pro" = "basic") {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("subscribe_analytics", {
    p_agent_id: agentId,
    p_plan: plan,
  });
  if (error) return { error: "Subscription failed", status: 500 as const };
  if (!data?.success) return { error: data?.error ?? "Unknown error", status: 400 as const };
  return { data, status: 200 as const };
}

/**
 * Get analytics dashboard data (requires active subscription).
 */
export async function getAnalyticsDashboard(agentId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("get_analytics_dashboard", {
    p_agent_id: agentId,
  });
  if (error) return { error: "Failed to fetch analytics", status: 500 as const };
  if (!data?.success) return { error: data?.error ?? "No subscription", status: 403 as const };
  return { data, status: 200 as const };
}

/**
 * Check if agent has active analytics subscription.
 */
export async function getSubscriptionStatus(agentId: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("analytics_subscriptions")
    .select("*")
    .eq("agent_id", agentId)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data ?? null;
}

/**
 * Cancel auto-renewal for analytics subscription.
 */
export async function cancelSubscription(agentId: string) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("analytics_subscriptions")
    .update({ auto_renew: false })
    .eq("agent_id", agentId)
    .eq("status", "active");
  if (error) return { error: "Failed to cancel", status: 500 as const };
  return { success: true };
}
