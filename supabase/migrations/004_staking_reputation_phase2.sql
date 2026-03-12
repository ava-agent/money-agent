-- Migration 004: Staking & Reputation Phase 2
-- Staking/unstaking, ratings, slash, tier-based perks
-- ============================================================================

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  1. Unstake requests (7-day cooldown tracking)               ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS unstake_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID NOT NULL REFERENCES agents(id),
  amount       INTEGER NOT NULL CHECK (amount > 0),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  release_at   TIMESTAMPTZ NOT NULL,  -- requested_at + 7 days
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unstake_requests_agent_id ON unstake_requests (agent_id);
CREATE INDEX IF NOT EXISTS idx_unstake_requests_status ON unstake_requests (status, release_at);

ALTER TABLE unstake_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read unstake requests" ON unstake_requests FOR SELECT USING (true);

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  2. Task ratings (bi-directional: publisher ↔ assignee)      ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS task_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id),
  rater_id   UUID NOT NULL REFERENCES agents(id),
  ratee_id   UUID NOT NULL REFERENCES agents(id),
  rating     INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment    TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, rater_id)  -- one rating per rater per task
);

CREATE INDEX IF NOT EXISTS idx_task_ratings_ratee_id ON task_ratings (ratee_id);
CREATE INDEX IF NOT EXISTS idx_task_ratings_task_id ON task_ratings (task_id);

ALTER TABLE task_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ratings" ON task_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert ratings" ON task_ratings FOR INSERT WITH CHECK (true);

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  3. Slash log (audit trail for all slash events)             ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS slash_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID NOT NULL REFERENCES agents(id),
  amount       INTEGER NOT NULL CHECK (amount > 0),
  reason       TEXT NOT NULL,
  slash_pct    INTEGER NOT NULL,  -- percentage slashed (10, 20, 50, 100)
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_slash_log_agent_id ON slash_log (agent_id);

ALTER TABLE slash_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read slash log" ON slash_log FOR SELECT USING (true);

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  4. Compute tier from staked_balance (pure function)         ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION compute_tier(p_staked INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN p_staked >= 1000 THEN 'diamond'
    WHEN p_staked >= 500  THEN 'gold'
    WHEN p_staked >= 200  THEN 'silver'
    ELSE 'bronze'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  5. Stake tokens (atomic: debit balance → credit staked)     ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION stake_claw(p_agent_id UUID, p_amount INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_balance     INTEGER;
  v_staked      INTEGER;
  v_new_staked  INTEGER;
  v_new_tier    TEXT;
  v_old_tier    TEXT;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('error', 'amount_must_be_positive');
  END IF;

  -- Lock agent row
  SELECT claw_balance, staked_balance, tier
  INTO v_balance, v_staked, v_old_tier
  FROM agents WHERE id = p_agent_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'agent_not_found');
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('error', 'insufficient_balance', 'available', v_balance, 'requested', p_amount);
  END IF;

  v_new_staked := v_staked + p_amount;
  v_new_tier   := compute_tier(v_new_staked);

  -- Move tokens from balance to staked
  UPDATE agents SET
    claw_balance   = claw_balance - p_amount,
    staked_balance = v_new_staked,
    tier           = v_new_tier
  WHERE id = p_agent_id;

  -- Record transaction
  INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, description)
  VALUES (p_agent_id, NULL, p_amount, 'stake',
          'Staked ' || p_amount || ' $CLAW (tier: ' || v_old_tier || ' → ' || v_new_tier || ')');

  RETURN jsonb_build_object(
    'success', true,
    'staked_amount', p_amount,
    'total_staked', v_new_staked,
    'old_tier', v_old_tier,
    'new_tier', v_new_tier,
    'remaining_balance', v_balance - p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  6. Initiate unstake (7-day cooldown, tier drops immediately)║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION initiate_unstake(p_agent_id UUID, p_amount INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_staked     INTEGER;
  v_new_staked INTEGER;
  v_new_tier   TEXT;
  v_old_tier   TEXT;
  v_release_at TIMESTAMPTZ;
  v_request_id UUID;
  v_pending    INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('error', 'amount_must_be_positive');
  END IF;

  -- Lock agent row
  SELECT staked_balance, tier
  INTO v_staked, v_old_tier
  FROM agents WHERE id = p_agent_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'agent_not_found');
  END IF;

  -- Check for existing pending unstake requests
  SELECT COALESCE(SUM(amount), 0) INTO v_pending
  FROM unstake_requests WHERE agent_id = p_agent_id AND status = 'pending';

  IF v_staked - v_pending < p_amount THEN
    RETURN jsonb_build_object(
      'error', 'insufficient_staked',
      'staked', v_staked,
      'pending_unstake', v_pending,
      'available_to_unstake', v_staked - v_pending,
      'requested', p_amount
    );
  END IF;

  v_release_at := now() + interval '7 days';
  v_new_staked := v_staked - p_amount;
  v_new_tier   := compute_tier(v_new_staked - v_pending + p_amount);
  -- Tier based on effective staked after this request
  v_new_tier   := compute_tier(v_staked - v_pending - p_amount);

  -- Tier drops immediately
  UPDATE agents SET tier = v_new_tier WHERE id = p_agent_id;

  -- Create unstake request
  INSERT INTO unstake_requests (agent_id, amount, status, release_at)
  VALUES (p_agent_id, p_amount, 'pending', v_release_at)
  RETURNING id INTO v_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'amount', p_amount,
    'release_at', v_release_at,
    'old_tier', v_old_tier,
    'new_tier', v_new_tier,
    'cooldown_days', 7
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  7. Process unstake (after cooldown expires)                 ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION process_unstake(p_request_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_req     unstake_requests%ROWTYPE;
  v_in_prog INTEGER;
BEGIN
  -- Lock the request
  SELECT * INTO v_req FROM unstake_requests WHERE id = p_request_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'request_not_found');
  END IF;

  IF v_req.status != 'pending' THEN
    RETURN jsonb_build_object('error', 'request_not_pending', 'status', v_req.status);
  END IF;

  IF now() < v_req.release_at THEN
    RETURN jsonb_build_object('error', 'cooldown_not_expired', 'release_at', v_req.release_at);
  END IF;

  -- Check if agent has in-progress tasks (as assignee)
  SELECT count(*) INTO v_in_prog
  FROM tasks WHERE assignee_id = v_req.agent_id AND status IN ('in_progress', 'submitted');

  IF v_in_prog > 0 THEN
    RETURN jsonb_build_object('error', 'has_active_tasks', 'count', v_in_prog);
  END IF;

  -- Move tokens from staked back to balance
  UPDATE agents SET
    staked_balance = GREATEST(staked_balance - v_req.amount, 0),
    claw_balance   = claw_balance + v_req.amount
  WHERE id = v_req.agent_id;

  -- Recalculate tier based on remaining stake
  UPDATE agents SET tier = compute_tier(staked_balance) WHERE id = v_req.agent_id;

  -- Mark request completed
  UPDATE unstake_requests SET
    status = 'completed',
    completed_at = now()
  WHERE id = p_request_id;

  -- Record transaction
  INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, description)
  VALUES (NULL, v_req.agent_id, v_req.amount, 'unstake',
          'Unstaked ' || v_req.amount || ' $CLAW (cooldown completed)');

  RETURN jsonb_build_object('success', true, 'amount', v_req.amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  8. Slash mechanism (burn staked tokens)                     ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION slash_agent(
  p_agent_id   UUID,
  p_percentage INTEGER,  -- 10, 20, 50, or 100
  p_reason     TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_staked     INTEGER;
  v_slash_amt  INTEGER;
  v_new_staked INTEGER;
  v_new_tier   TEXT;
BEGIN
  IF p_percentage <= 0 OR p_percentage > 100 THEN
    RETURN jsonb_build_object('error', 'invalid_percentage');
  END IF;

  SELECT staked_balance INTO v_staked
  FROM agents WHERE id = p_agent_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'agent_not_found');
  END IF;

  v_slash_amt  := CEIL(v_staked * p_percentage / 100.0);

  IF v_slash_amt <= 0 THEN
    RETURN jsonb_build_object('error', 'nothing_to_slash', 'staked', v_staked);
  END IF;

  v_new_staked := v_staked - v_slash_amt;
  v_new_tier   := compute_tier(v_new_staked);

  -- Deduct from staked balance, recalculate tier
  UPDATE agents SET
    staked_balance = v_new_staked,
    tier = v_new_tier
  WHERE id = p_agent_id;

  -- Burn the slashed tokens
  UPDATE platform_state SET
    total_burned = total_burned + v_slash_amt,
    updated_at = now()
  WHERE id = 1;

  -- Record slash transaction
  INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, description)
  VALUES (p_agent_id, NULL, v_slash_amt, 'penalty',
          'Slash ' || p_percentage || '% stake: ' || p_reason);

  -- Record in slash log
  INSERT INTO slash_log (agent_id, amount, reason, slash_pct)
  VALUES (p_agent_id, v_slash_amt, p_reason, p_percentage);

  -- Deduct reputation
  PERFORM increment_reputation(p_agent_id, -50);

  RETURN jsonb_build_object(
    'success', true,
    'slashed_amount', v_slash_amt,
    'remaining_staked', v_new_staked,
    'new_tier', v_new_tier,
    'reason', p_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  9. Reputation recalculation based on ratings                ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION recalculate_reputation(p_agent_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_base       INTEGER := 100;
  v_task_score INTEGER := 0;
  v_quality    INTEGER := 0;
  v_penalty    INTEGER := 0;
  v_completed  INTEGER;
  v_rejected   INTEGER;
  v_avg_rating NUMERIC;
  v_total      INTEGER;
BEGIN
  -- Task score: +2 per completed (as assignee), -5 per rejection
  SELECT count(*) INTO v_completed
  FROM tasks WHERE assignee_id = p_agent_id AND status = 'completed';

  SELECT count(*) INTO v_rejected
  FROM activity_feed
  WHERE agent_id = p_agent_id
    AND event_type = 'task_submitted'
    AND (metadata->>'rejected')::boolean = true;

  v_task_score := LEAST(v_completed * 2 - v_rejected * 5, 500);

  -- Quality score from ratings received
  SELECT COALESCE(AVG(rating), 0) INTO v_avg_rating
  FROM task_ratings WHERE ratee_id = p_agent_id;

  IF v_avg_rating > 0 THEN
    v_quality := LEAST(CASE
      WHEN v_avg_rating >= 4.5 THEN (v_completed * 10)  -- ~10 per task
      WHEN v_avg_rating >= 3.5 THEN (v_completed * 5)   -- ~5 per task
      WHEN v_avg_rating >= 2.5 THEN 0
      WHEN v_avg_rating >= 1.5 THEN (v_completed * -10)
      ELSE (v_completed * -20)
    END, 300);
  END IF;

  -- Penalty from slashes
  SELECT COALESCE(count(*) * 50, 0) INTO v_penalty FROM slash_log WHERE agent_id = p_agent_id;

  v_total := GREATEST(v_base + v_task_score + v_quality - v_penalty, 0);

  -- Update agent reputation
  UPDATE agents SET reputation_score = v_total WHERE id = p_agent_id;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  10. Add 'stake' and 'unstake' to allowed transaction types  ║
-- ║      (no constraint to modify — types are free-form text)    ║
-- ╚═══════════════════════════════════════════════════════════════╝
-- Transaction types now include: registration, bid_escrow, bid_refund,
-- reward, penalty, bonus, fee_burn, fee_treasury, fee_staker, stake, unstake
