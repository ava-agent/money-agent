export interface Category {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

export interface Method {
  id: number;
  slug: string;
  number: number;
  category_id: string;
  title: string;
  description: string;
  income: string;
  icon: string;
  detail_markdown: string;
  difficulty: string;
  risk_level: string;
  created_at: string;
}

export interface BusinessModel {
  id: number;
  slug: string;
  title: string;
  description: string;
  income_range: string;
  steps_markdown: string;
  sort_order: number;
  created_at: string;
}

export interface GuideSection {
  id: number;
  slug: string;
  title: string;
  content_markdown: string;
  sort_order: number;
  section_type: string;
}

// ─── CLAWX Types ────────────────────────────

export type AgentTier = "bronze" | "silver" | "gold" | "diamond";

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  status: "active" | "suspended" | "pending";
  claw_balance: number;
  staked_balance: number;
  frozen_balance: number;
  tier: AgentTier;
  reputation_score: number;
  claimed_by_email: string | null;
  claimed_at: string | null;
  restrictions_lift_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskMode = "open" | "bidding" | "auto";
export type TaskStatus =
  | "open" | "bidding" | "assigned" | "in_progress"
  | "submitted" | "completed" | "failed" | "expired";
export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface TaskTemplate {
  id: number;
  slug: string;
  title: string;
  category_id: string;
  description: string;
  default_reward: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_duration: string | null;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
}

export interface Task {
  id: string;
  template_id: number | null;
  publisher_id: string;
  assignee_id: string | null;
  title: string;
  description: string;
  reward: number;
  mode: TaskMode;
  status: TaskStatus;
  priority: TaskPriority;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown> | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  publisher?: Agent;
  assignee?: Agent;
  template?: TaskTemplate;
  bids_count?: number;
}

export interface TaskBid {
  id: string;
  task_id: string;
  agent_id: string;
  amount: number;
  message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  agent?: Agent;
}

export interface Transaction {
  id: string;
  from_agent_id: string | null;
  to_agent_id: string | null;
  amount: number;
  type: "reward" | "bid_escrow" | "bid_refund" | "penalty" | "bonus" | "registration" | "fee_burn" | "fee_treasury" | "fee_staker" | "stake" | "unstake";
  task_id: string | null;
  description: string;
  created_at: string;
}

export type FeedEventType =
  | "task_created" | "task_claimed" | "task_assigned"
  | "bid_placed" | "task_submitted" | "task_completed"
  | "task_failed" | "task_expired" | "agent_registered";

export interface FeedEvent {
  id: string;
  event_type: FeedEventType;
  agent_id: string;
  task_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  agent?: Agent;
  task?: Task;
}

export interface ExchangeStats {
  total_tasks: number;
  active_agents: number;
  volume_24h: number;
  tasks_in_progress: number;
  tasks_completed_24h: number;
  claw_in_circulation: number;
}

export interface Tokenomics {
  supply_cap: number;
  total_emitted: number;
  total_burned: number;
  in_circulation: number;
  treasury_balance: number;
  staker_pool_balance: number;
  insurance_pool_balance: number;
  active_agents: number;
  volume_24h: number;
  fees_24h: number;
  burned_24h: number;
}

// ─── Phase 4: Advanced Financialization Types ────────────────────────────

export interface AgentToken {
  id: string;
  agent_id: string;
  symbol: string;
  total_supply: number;
  agent_held: number;
  public_sold: number;
  price_per_token: number;
  status: "active" | "paused" | "closed";
  created_at: string;
}

export interface AgentTokenHolding {
  id: string;
  token_id: string;
  holder_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface DividendDistribution {
  id: string;
  token_id: string;
  period_start: string;
  period_end: string;
  total_income: number;
  dividend_pool: number;
  distributed: boolean;
  created_at: string;
}

export interface DividendPayout {
  id: string;
  distribution_id: string;
  holder_id: string;
  amount: number;
  created_at: string;
}

export interface AnalyticsSubscription {
  id: string;
  agent_id: string;
  plan: "basic" | "pro";
  cost_per_month: number;
  starts_at: string;
  expires_at: string;
  auto_renew: boolean;
  status: "active" | "expired" | "cancelled";
  created_at: string;
}

export interface InsuranceClaim {
  id: string;
  task_id: string;
  claimant_id: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface SettlementChannel {
  id: string;
  platform_name: string;
  endpoint_url: string | null;
  api_key_hash: string | null;
  status: "pending" | "active" | "disabled";
  created_at: string;
}

export interface SettlementTransaction {
  id: string;
  channel_id: string;
  direction: "inbound" | "outbound";
  agent_id: string;
  amount: number;
  external_ref: string | null;
  status: "pending" | "confirmed" | "failed";
  created_at: string;
}
