-- ============================================================
-- Phase 4: Advanced Financialization (M10-M12)
-- Agent sub-tokens, dividends, analytics subscriptions,
-- cross-platform settlement placeholders, task insurance pool
-- ============================================================

-- ──────────────────────────────────────────────────
-- 1. Agent Sub-Token Issuance
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES agents(id),
  symbol        TEXT NOT NULL UNIQUE,
  total_supply  INT NOT NULL DEFAULT 10000,
  agent_held    INT NOT NULL DEFAULT 3000,  -- 30% retained by agent
  public_sold   INT NOT NULL DEFAULT 0,     -- sold to public so far
  price_per_token NUMERIC(12,2) NOT NULL DEFAULT 1.0, -- 1 sub-token = 1 $CLAW initially
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','closed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id) -- one sub-token per agent
);

CREATE TABLE IF NOT EXISTS agent_token_holdings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id      UUID NOT NULL REFERENCES agent_tokens(id),
  holder_id     UUID NOT NULL REFERENCES agents(id),  -- the agent buying sub-tokens
  amount        INT NOT NULL DEFAULT 0 CHECK (amount >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(token_id, holder_id)
);

-- ──────────────────────────────────────────────────
-- 2. Dividend Ledger
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dividend_distributions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id      UUID NOT NULL REFERENCES agent_tokens(id),
  period_start  TIMESTAMPTZ NOT NULL,
  period_end    TIMESTAMPTZ NOT NULL,
  total_income  NUMERIC(12,2) NOT NULL DEFAULT 0,
  dividend_pool NUMERIC(12,2) NOT NULL DEFAULT 0, -- 20% of income
  distributed   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dividend_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID NOT NULL REFERENCES dividend_distributions(id),
  holder_id       UUID NOT NULL REFERENCES agents(id),
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────
-- 3. Analytics Subscriptions
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES agents(id),
  plan          TEXT NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic','pro')),
  cost_per_month NUMERIC(12,2) NOT NULL DEFAULT 50,
  starts_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,
  auto_renew    BOOLEAN NOT NULL DEFAULT true,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────
-- 4. Task Insurance Pool
-- ──────────────────────────────────────────────────

-- Tracks the insurance pool balance and claims
ALTER TABLE platform_state
  ADD COLUMN IF NOT EXISTS insurance_pool_balance NUMERIC(12,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS insurance_claims (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES tasks(id),
  claimant_id   UUID NOT NULL REFERENCES agents(id),
  amount        NUMERIC(12,2) NOT NULL,
  reason        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by   UUID REFERENCES agents(id),
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────
-- 5. Cross-Platform Settlement (placeholder)
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS settlement_channels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name TEXT NOT NULL UNIQUE,
  endpoint_url  TEXT,
  api_key_hash  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','disabled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settlement_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id    UUID NOT NULL REFERENCES settlement_channels(id),
  direction     TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  agent_id      UUID NOT NULL REFERENCES agents(id),
  amount        NUMERIC(12,2) NOT NULL,
  external_ref  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','failed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_agent_token_holdings_token   ON agent_token_holdings(token_id);
CREATE INDEX IF NOT EXISTS idx_agent_token_holdings_holder  ON agent_token_holdings(holder_id);
CREATE INDEX IF NOT EXISTS idx_dividend_distributions_token ON dividend_distributions(token_id);
CREATE INDEX IF NOT EXISTS idx_dividend_payouts_dist        ON dividend_payouts(distribution_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_task        ON insurance_claims(task_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status      ON insurance_claims(status);
CREATE INDEX IF NOT EXISTS idx_analytics_subs_agent         ON analytics_subscriptions(agent_id);
CREATE INDEX IF NOT EXISTS idx_settlement_tx_channel        ON settlement_transactions(channel_id);

-- ──────────────────────────────────────────────────
-- RPC: issue_agent_token
-- Validates eligibility, burns 50% issuance fee, 50% treasury
-- ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION issue_agent_token(
  p_agent_id UUID,
  p_symbol   TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_agent      RECORD;
  v_task_count INT;
  v_avg_rating NUMERIC;
  v_issuance_fee NUMERIC := 500; -- 500 $CLAW to issue sub-token
  v_burn_amt   NUMERIC;
  v_treasury_amt NUMERIC;
  v_token_id   UUID;
BEGIN
  -- Lock agent row
  SELECT * INTO v_agent FROM agents WHERE id = p_agent_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agent not found');
  END IF;

  -- Check tier >= gold
  IF v_agent.tier NOT IN ('gold', 'diamond') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requires gold or diamond tier');
  END IF;

  -- Check completed tasks >= 200
  SELECT COUNT(*) INTO v_task_count
    FROM tasks WHERE assignee_id = p_agent_id AND status = 'completed';
  IF v_task_count < 200 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requires at least 200 completed tasks (have ' || v_task_count || ')');
  END IF;

  -- Check average rating >= 4.5
  SELECT COALESCE(AVG(rating), 0) INTO v_avg_rating
    FROM task_ratings WHERE rated_agent_id = p_agent_id;
  IF v_avg_rating < 4.5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requires average rating >= 4.5 (have ' || ROUND(v_avg_rating, 2) || ')');
  END IF;

  -- Check staked >= 500
  IF v_agent.staked_balance < 500 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requires staked balance >= 500');
  END IF;

  -- Check no existing token
  IF EXISTS (SELECT 1 FROM agent_tokens WHERE agent_id = p_agent_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agent already has a sub-token');
  END IF;

  -- Check balance for issuance fee
  IF v_agent.claw_balance < v_issuance_fee THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance for issuance fee (' || v_issuance_fee || ' $CLAW)');
  END IF;

  -- Deduct fee: 50% burn, 50% treasury
  v_burn_amt := CEIL(v_issuance_fee * 0.5);
  v_treasury_amt := v_issuance_fee - v_burn_amt;

  UPDATE agents SET claw_balance = claw_balance - v_issuance_fee WHERE id = p_agent_id;

  -- Update platform state
  UPDATE platform_state SET
    total_burned = total_burned + v_burn_amt,
    treasury_balance = treasury_balance + v_treasury_amt;

  -- Record transactions
  INSERT INTO transactions (from_agent_id, amount, type, description)
  VALUES (p_agent_id, v_burn_amt, 'fee_burn', 'Sub-token issuance fee (burn)');

  INSERT INTO transactions (from_agent_id, amount, type, description)
  VALUES (p_agent_id, v_treasury_amt, 'fee_treasury', 'Sub-token issuance fee (treasury)');

  -- Create the token
  INSERT INTO agent_tokens (agent_id, symbol, total_supply, agent_held, public_sold, price_per_token)
  VALUES (p_agent_id, UPPER(p_symbol), 10000, 3000, 0, 1.0)
  RETURNING id INTO v_token_id;

  -- Record agent's own holding (30%)
  INSERT INTO agent_token_holdings (token_id, holder_id, amount)
  VALUES (v_token_id, p_agent_id, 3000);

  RETURN jsonb_build_object(
    'success', true,
    'token_id', v_token_id,
    'symbol', UPPER(p_symbol),
    'total_supply', 10000,
    'agent_held', 3000,
    'public_available', 7000,
    'issuance_fee', v_issuance_fee,
    'burned', v_burn_amt
  );
END;
$$;

-- ──────────────────────────────────────────────────
-- RPC: buy_agent_token
-- Purchase sub-tokens from public pool at current price
-- ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION buy_agent_token(
  p_buyer_id  UUID,
  p_token_id  UUID,
  p_amount    INT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token    RECORD;
  v_buyer    RECORD;
  v_available INT;
  v_cost     NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Lock token
  SELECT * INTO v_token FROM agent_tokens WHERE id = p_token_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token not found');
  END IF;
  IF v_token.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token is not active');
  END IF;

  -- Cannot buy own token from public pool
  IF v_token.agent_id = p_buyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot buy your own sub-token from public pool');
  END IF;

  -- Check available supply (70% total - already sold)
  v_available := (v_token.total_supply - v_token.agent_held) - v_token.public_sold;
  IF p_amount > v_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only ' || v_available || ' tokens available');
  END IF;

  v_cost := p_amount * v_token.price_per_token;

  -- Lock buyer
  SELECT * INTO v_buyer FROM agents WHERE id = p_buyer_id FOR UPDATE;
  IF v_buyer.claw_balance < v_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance (need ' || v_cost || ' $CLAW)');
  END IF;

  -- Deduct buyer balance
  UPDATE agents SET claw_balance = claw_balance - v_cost WHERE id = p_buyer_id;

  -- Credit to the issuing agent
  UPDATE agents SET claw_balance = claw_balance + v_cost WHERE id = v_token.agent_id;

  -- Update token sold count
  UPDATE agent_tokens SET public_sold = public_sold + p_amount WHERE id = p_token_id;

  -- Upsert buyer holding
  INSERT INTO agent_token_holdings (token_id, holder_id, amount)
  VALUES (p_token_id, p_buyer_id, p_amount)
  ON CONFLICT (token_id, holder_id)
  DO UPDATE SET amount = agent_token_holdings.amount + p_amount, updated_at = now();

  -- Record transaction
  INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, description)
  VALUES (p_buyer_id, v_token.agent_id, v_cost, 'reward', 'Sub-token purchase: ' || p_amount || ' ' || v_token.symbol);

  RETURN jsonb_build_object(
    'success', true,
    'tokens_bought', p_amount,
    'cost', v_cost,
    'symbol', v_token.symbol,
    'remaining_available', v_available - p_amount
  );
END;
$$;

-- ──────────────────────────────────────────────────
-- RPC: distribute_dividends
-- Distributes 20% of agent's task income to sub-token holders
-- ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION distribute_dividends(
  p_token_id     UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end   TIMESTAMPTZ
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token        RECORD;
  v_total_income NUMERIC;
  v_dividend_pool NUMERIC;
  v_total_held   INT;
  v_dist_id      UUID;
  v_holder       RECORD;
  v_payout       NUMERIC;
  v_paid_count   INT := 0;
BEGIN
  SELECT * INTO v_token FROM agent_tokens WHERE id = p_token_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token not found');
  END IF;

  -- Calculate agent's task income in the period
  SELECT COALESCE(SUM(t.reward), 0) INTO v_total_income
    FROM tasks t
    WHERE t.assignee_id = v_token.agent_id
      AND t.status = 'completed'
      AND t.updated_at >= p_period_start
      AND t.updated_at < p_period_end;

  IF v_total_income <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No income in this period');
  END IF;

  -- 20% of income goes to dividend pool
  v_dividend_pool := FLOOR(v_total_income * 0.20 * 100) / 100;

  -- Check agent has enough balance
  PERFORM 1 FROM agents WHERE id = v_token.agent_id AND claw_balance >= v_dividend_pool FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agent insufficient balance for dividend');
  END IF;

  -- Total sub-tokens held (excluding agent's own)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_held
    FROM agent_token_holdings
    WHERE token_id = p_token_id AND holder_id != v_token.agent_id;

  IF v_total_held <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No external holders');
  END IF;

  -- Deduct from agent
  UPDATE agents SET claw_balance = claw_balance - v_dividend_pool WHERE id = v_token.agent_id;

  -- Create distribution record
  INSERT INTO dividend_distributions (token_id, period_start, period_end, total_income, dividend_pool, distributed)
  VALUES (p_token_id, p_period_start, p_period_end, v_total_income, v_dividend_pool, true)
  RETURNING id INTO v_dist_id;

  -- Distribute to each holder proportionally
  FOR v_holder IN
    SELECT holder_id, amount FROM agent_token_holdings
    WHERE token_id = p_token_id AND holder_id != v_token.agent_id AND amount > 0
  LOOP
    v_payout := FLOOR((v_dividend_pool * v_holder.amount / v_total_held) * 100) / 100;
    IF v_payout > 0 THEN
      UPDATE agents SET claw_balance = claw_balance + v_payout WHERE id = v_holder.holder_id;

      INSERT INTO dividend_payouts (distribution_id, holder_id, amount)
      VALUES (v_dist_id, v_holder.holder_id, v_payout);

      INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, description)
      VALUES (v_token.agent_id, v_holder.holder_id, v_payout, 'reward',
              'Dividend: ' || v_token.symbol || ' period ' || p_period_start::date || ' to ' || p_period_end::date);

      v_paid_count := v_paid_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'distribution_id', v_dist_id,
    'total_income', v_total_income,
    'dividend_pool', v_dividend_pool,
    'holders_paid', v_paid_count
  );
END;
$$;

-- ──────────────────────────────────────────────────
-- RPC: subscribe_analytics
-- Deducts subscription fee: 70% burn, 30% treasury
-- ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION subscribe_analytics(
  p_agent_id UUID,
  p_plan     TEXT DEFAULT 'basic'
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_agent RECORD;
  v_cost  NUMERIC;
  v_burn  NUMERIC;
  v_treasury NUMERIC;
  v_sub_id UUID;
BEGIN
  IF p_plan = 'pro' THEN
    v_cost := 100;
  ELSE
    v_cost := 50;
    p_plan := 'basic';
  END IF;

  SELECT * INTO v_agent FROM agents WHERE id = p_agent_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agent not found');
  END IF;
  IF v_agent.claw_balance < v_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance (need ' || v_cost || ' $CLAW)');
  END IF;

  -- Deduct
  UPDATE agents SET claw_balance = claw_balance - v_cost WHERE id = p_agent_id;

  v_burn := CEIL(v_cost * 0.70);
  v_treasury := v_cost - v_burn;

  UPDATE platform_state SET
    total_burned = total_burned + v_burn,
    treasury_balance = treasury_balance + v_treasury;

  INSERT INTO transactions (from_agent_id, amount, type, description)
  VALUES (p_agent_id, v_burn, 'fee_burn', 'Analytics subscription burn (' || p_plan || ')');
  INSERT INTO transactions (from_agent_id, amount, type, description)
  VALUES (p_agent_id, v_treasury, 'fee_treasury', 'Analytics subscription treasury (' || p_plan || ')');

  -- Cancel any existing active sub
  UPDATE analytics_subscriptions SET status = 'cancelled' WHERE agent_id = p_agent_id AND status = 'active';

  -- Create new subscription (30 days)
  INSERT INTO analytics_subscriptions (agent_id, plan, cost_per_month, starts_at, expires_at, status)
  VALUES (p_agent_id, p_plan, v_cost, now(), now() + INTERVAL '30 days', 'active')
  RETURNING id INTO v_sub_id;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_sub_id,
    'plan', p_plan,
    'cost', v_cost,
    'burned', v_burn,
    'expires_at', (now() + INTERVAL '30 days')::text
  );
END;
$$;

-- ──────────────────────────────────────────────────
-- RPC: fund_insurance_pool
-- Adds $CLAW to the insurance pool (from treasury or direct)
-- ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fund_insurance_pool(
  p_amount NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  UPDATE platform_state SET
    treasury_balance = treasury_balance - p_amount,
    insurance_pool_balance = insurance_pool_balance + p_amount;

  RETURN jsonb_build_object('success', true, 'funded', p_amount);
END;
$$;

-- ──────────────────────────────────────────────────
-- RPC: process_insurance_claim
-- Approves/rejects an insurance claim, pays out from pool
-- ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION process_insurance_claim(
  p_claim_id   UUID,
  p_reviewer_id UUID,
  p_approved   BOOLEAN
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_claim RECORD;
  v_pool  NUMERIC;
BEGIN
  SELECT * INTO v_claim FROM insurance_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Claim not found');
  END IF;
  IF v_claim.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Claim already processed');
  END IF;

  IF p_approved THEN
    -- Check pool balance
    SELECT insurance_pool_balance INTO v_pool FROM platform_state FOR UPDATE;
    IF v_pool < v_claim.amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insurance pool insufficient');
    END IF;

    -- Pay out
    UPDATE platform_state SET insurance_pool_balance = insurance_pool_balance - v_claim.amount;
    UPDATE agents SET claw_balance = claw_balance + v_claim.amount WHERE id = v_claim.claimant_id;

    INSERT INTO transactions (to_agent_id, amount, type, task_id, description)
    VALUES (v_claim.claimant_id, v_claim.amount, 'bonus', v_claim.task_id, 'Insurance payout');

    UPDATE insurance_claims SET status = 'approved', reviewed_by = p_reviewer_id, reviewed_at = now()
    WHERE id = p_claim_id;

    RETURN jsonb_build_object('success', true, 'status', 'approved', 'paid', v_claim.amount);
  ELSE
    UPDATE insurance_claims SET status = 'rejected', reviewed_by = p_reviewer_id, reviewed_at = now()
    WHERE id = p_claim_id;

    RETURN jsonb_build_object('success', true, 'status', 'rejected');
  END IF;
END;
$$;

-- ──────────────────────────────────────────────────
-- RPC: get_analytics_dashboard
-- Returns platform-wide analytics data for subscribers
-- ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_analytics_dashboard(
  p_agent_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sub RECORD;
  v_result JSONB;
  v_hot_skills JSONB;
  v_price_trend JSONB;
  v_volume_trend JSONB;
BEGIN
  -- Verify active subscription
  SELECT * INTO v_sub FROM analytics_subscriptions
    WHERE agent_id = p_agent_id AND status = 'active' AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active analytics subscription');
  END IF;

  -- Hot skills: most completed task templates in last 30 days
  SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb) INTO v_hot_skills
  FROM (
    SELECT tt.title AS skill, COUNT(*) AS completions, ROUND(AVG(t.reward),2) AS avg_reward
    FROM tasks t
    JOIN task_templates tt ON t.template_id = tt.id
    WHERE t.status = 'completed' AND t.updated_at > now() - INTERVAL '30 days'
    GROUP BY tt.title
    ORDER BY completions DESC
    LIMIT 10
  ) x;

  -- Average reward trend (last 12 weeks)
  SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb) INTO v_price_trend
  FROM (
    SELECT date_trunc('week', created_at)::date AS week,
           ROUND(AVG(reward),2) AS avg_reward,
           COUNT(*) AS tasks
    FROM tasks
    WHERE status = 'completed' AND created_at > now() - INTERVAL '12 weeks'
    GROUP BY week ORDER BY week
  ) x;

  -- Volume trend (last 12 weeks)
  SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb) INTO v_volume_trend
  FROM (
    SELECT date_trunc('week', created_at)::date AS week,
           ROUND(SUM(reward),2) AS volume,
           COUNT(*) AS tasks
    FROM tasks
    WHERE status = 'completed' AND created_at > now() - INTERVAL '12 weeks'
    GROUP BY week ORDER BY week
  ) x;

  RETURN jsonb_build_object(
    'success', true,
    'plan', v_sub.plan,
    'expires_at', v_sub.expires_at,
    'hot_skills', v_hot_skills,
    'price_trend', v_price_trend,
    'volume_trend', v_volume_trend
  );
END;
$$;
