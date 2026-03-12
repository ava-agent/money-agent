import { createServerClient } from "@/lib/supabase/server";

/**
 * Issue a new agent sub-token. Requires Gold+, 200+ tasks, 4.5+ rating, 500+ staked.
 * Issuance fee: 500 $CLAW (50% burn / 50% treasury).
 */
export async function issueToken(agentId: string, symbol: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("issue_agent_token", {
    p_agent_id: agentId,
    p_symbol: symbol,
  });
  if (error) return { error: "Token issuance failed", status: 500 as const };
  if (!data?.success) return { error: data?.error ?? "Unknown error", status: 400 as const };
  return { data, status: 201 as const };
}

/**
 * Buy sub-tokens from the public pool.
 */
export async function buyToken(buyerId: string, tokenId: string, amount: number) {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("buy_agent_token", {
    p_buyer_id: buyerId,
    p_token_id: tokenId,
    p_amount: amount,
  });
  if (error) return { error: "Purchase failed", status: 500 as const };
  if (!data?.success) return { error: data?.error ?? "Unknown error", status: 400 as const };
  return { data, status: 200 as const };
}

/**
 * Get sub-token info for an agent.
 */
export async function getAgentToken(agentId: string) {
  const supabase = createServerClient();
  const { data: token } = await supabase
    .from("agent_tokens")
    .select("*")
    .eq("agent_id", agentId)
    .single();

  if (!token) return null;

  const { data: holders } = await supabase
    .from("agent_token_holdings")
    .select("holder_id, amount")
    .eq("token_id", token.id)
    .order("amount", { ascending: false });

  const { data: dividends } = await supabase
    .from("dividend_distributions")
    .select("*")
    .eq("token_id", token.id)
    .order("period_end", { ascending: false })
    .limit(10);

  return {
    ...token,
    public_available: token.total_supply - token.agent_held - token.public_sold,
    holders: holders ?? [],
    recent_dividends: dividends ?? [],
  };
}

/**
 * Get token holdings for a buyer agent.
 */
export async function getMyHoldings(agentId: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("agent_token_holdings")
    .select("amount, token:agent_tokens!agent_token_holdings_token_id_fkey(id, symbol, agent_id, price_per_token, status)")
    .eq("holder_id", agentId)
    .gt("amount", 0);
  return data ?? [];
}

/**
 * Distribute dividends for a token (20% of task income in period).
 */
export async function distributeDividends(tokenId: string, periodStart: string, periodEnd: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("distribute_dividends", {
    p_token_id: tokenId,
    p_period_start: periodStart,
    p_period_end: periodEnd,
  });
  if (error) return { error: "Dividend distribution failed", status: 500 as const };
  if (!data?.success) return { error: data?.error ?? "Unknown error", status: 400 as const };
  return { data, status: 200 as const };
}
