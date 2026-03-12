-- Migration 003: Token Economy Phase 1
-- Fee system, supply tracking, registration bonus diminishing, burn mechanism
-- ============================================================================

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  1. Platform State (singleton row for global token economy)  ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS platform_state (
  id                  INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  supply_cap          INTEGER NOT NULL DEFAULT 10000000,
  total_emitted       INTEGER NOT NULL DEFAULT 0,
  total_burned        INTEGER NOT NULL DEFAULT 0,
  treasury_balance    INTEGER NOT NULL DEFAULT 0,
  staker_pool_balance INTEGER NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Initialize from existing registration transactions
INSERT INTO platform_state (id, supply_cap, total_emitted, total_burned, treasury_balance, staker_pool_balance)
VALUES (
  1,
  10000000,
  COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'registration'), 0),
  0,
  0,
  0
) ON CONFLICT (id) DO NOTHING;

-- RLS: read-only for anon, RPCs handle writes
ALTER TABLE platform_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read platform state" ON platform_state FOR SELECT USING (true);

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  2. Add token economy columns to agents                      ║
-- ╚═══════════════════════════════════════════════════════════════╝

ALTER TABLE agents ADD COLUMN IF NOT EXISTS staked_balance  INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS frozen_balance  INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS tier            TEXT    DEFAULT 'bronze';

-- Constraints (use DO block to avoid error if already exists)
DO $$ BEGIN
  ALTER TABLE agents ADD CONSTRAINT chk_staked_balance CHECK (staked_balance >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE agents ADD CONSTRAINT chk_frozen_balance CHECK (frozen_balance >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE agents ADD CONSTRAINT chk_tier CHECK (tier IN ('bronze', 'silver', 'gold', 'diamond'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Initialize frozen_balance from active escrows
UPDATE agents a SET frozen_balance = COALESCE((
  SELECT SUM(tk.reward)
  FROM tasks tk
  WHERE tk.publisher_id = a.id
    AND tk.status NOT IN ('completed', 'failed', 'expired')
), 0);

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  3. Fee rate function (pure, no side effects)                ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION get_fee_rate(p_tier TEXT)
RETURNS NUMERIC AS $$
BEGIN
  RETURN CASE p_tier
    WHEN 'diamond' THEN 0.02
    WHEN 'gold'    THEN 0.03
    WHEN 'silver'  THEN 0.04
    ELSE 0.05   -- bronze default
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  4. Registration bonus (diminishing based on agent count)    ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION get_registration_bonus()
RETURNS INTEGER AS $$
DECLARE
  agent_count INTEGER;
BEGIN
  SELECT count(*) INTO agent_count FROM agents;
  RETURN CASE
    WHEN agent_count < 1000  THEN 100
    WHEN agent_count < 5000  THEN 50
    WHEN agent_count < 20000 THEN 25
    WHEN agent_count < 50000 THEN 10
    ELSE 5
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  5. Grant registration bonus (atomic: supply check + credit) ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION grant_registration_bonus(p_agent_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_bonus  INTEGER;
  v_state  platform_state%ROWTYPE;
  v_tx_id  UUID;
BEGIN
  -- Lock platform state to prevent overshooting supply cap
  SELECT * INTO v_state FROM platform_state WHERE id = 1 FOR UPDATE;

  -- Calculate bonus based on current agent count
  v_bonus := get_registration_bonus();

  -- Enforce supply cap
  IF v_state.total_emitted + v_bonus > v_state.supply_cap THEN
    RETURN jsonb_build_object('error', 'supply_cap_reached', 'bonus', 0);
  END IF;

  -- Credit agent
  UPDATE agents SET claw_balance = claw_balance + v_bonus WHERE id = p_agent_id;

  -- Record transaction
  INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, description)
  VALUES (NULL, p_agent_id, v_bonus, 'registration',
          'Registration bonus (' || v_bonus || ' $CLAW)')
  RETURNING id INTO v_tx_id;

  -- Track emission
  UPDATE platform_state SET
    total_emitted = total_emitted + v_bonus,
    updated_at = now()
  WHERE id = 1;

  RETURN jsonb_build_object('success', true, 'bonus', v_bonus, 'tx_id', v_tx_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  6. Escrow with fee (atomic: escrow + fee charge + split)    ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION escrow_with_fee(
  p_agent_id UUID,
  p_reward   INTEGER,
  p_task_id  UUID
)
RETURNS JSONB AS $$
DECLARE
  v_tier      TEXT;
  v_balance   INTEGER;
  v_fee_rate  NUMERIC;
  v_fee       INTEGER;
  v_total     INTEGER;
  v_burn      INTEGER;
  v_treasury  INTEGER;
  v_staker    INTEGER;
BEGIN
  -- Lock agent row, get tier and balance
  SELECT tier, claw_balance INTO v_tier, v_balance
  FROM agents WHERE id = p_agent_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'agent_not_found');
  END IF;

  -- Calculate fee
  v_fee_rate := get_fee_rate(v_tier);
  v_fee      := CEIL(p_reward * v_fee_rate);
  v_total    := p_reward + v_fee;

  -- Check balance
  IF v_balance < v_total THEN
    RETURN jsonb_build_object(
      'error', 'insufficient_balance',
      'required', v_total,
      'available', v_balance,
      'reward', p_reward,
      'fee', v_fee
    );
  END IF;

  -- Debit agent (reward + fee), track frozen
  UPDATE agents SET
    claw_balance   = claw_balance - v_total,
    frozen_balance = frozen_balance + p_reward
  WHERE id = p_agent_id;

  -- Record escrow transaction
  INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, task_id, description)
  VALUES (p_agent_id, NULL, p_reward, 'bid_escrow', p_task_id, 'Task reward escrowed');

  -- Split fee: 50% burn, 30% treasury, 20% staker pool
  v_burn     := CEIL(v_fee * 0.5);
  v_treasury := CEIL(v_fee * 0.3);
  v_staker   := v_fee - v_burn - v_treasury;  -- remainder avoids rounding overshoot

  -- Record fee burn
  IF v_burn > 0 THEN
    INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, task_id, description)
    VALUES (p_agent_id, NULL, v_burn, 'fee_burn', p_task_id, 'Platform fee burned (50%)');
  END IF;

  -- Record treasury allocation
  IF v_treasury > 0 THEN
    INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, task_id, description)
    VALUES (p_agent_id, NULL, v_treasury, 'fee_treasury', p_task_id, 'Platform fee to treasury (30%)');
  END IF;

  -- Record staker pool allocation
  IF v_staker > 0 THEN
    INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, task_id, description)
    VALUES (p_agent_id, NULL, v_staker, 'fee_staker', p_task_id, 'Platform fee to staker pool (20%)');
  END IF;

  -- Update platform state
  UPDATE platform_state SET
    total_burned        = total_burned + v_burn,
    treasury_balance    = treasury_balance + v_treasury,
    staker_pool_balance = staker_pool_balance + v_staker,
    updated_at          = now()
  WHERE id = 1;

  RETURN jsonb_build_object(
    'success', true,
    'reward', p_reward,
    'fee', v_fee,
    'fee_rate', v_fee_rate,
    'burn', v_burn,
    'treasury', v_treasury,
    'staker', v_staker,
    'total_deducted', v_total,
    'tier', v_tier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  7. Release escrow on completion (update frozen_balance)     ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION release_escrow(
  p_task_id     UUID,
  p_assignee_id UUID,
  p_reward      INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_publisher_id UUID;
  v_tx_id UUID;
BEGIN
  -- Get publisher to update their frozen_balance
  SELECT publisher_id INTO v_publisher_id FROM tasks WHERE id = p_task_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'task_not_found');
  END IF;

  -- Reduce publisher's frozen_balance
  UPDATE agents SET frozen_balance = GREATEST(frozen_balance - p_reward, 0)
  WHERE id = v_publisher_id;

  -- Credit assignee
  UPDATE agents SET claw_balance = claw_balance + p_reward
  WHERE id = p_assignee_id;

  -- Record reward transaction
  INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, task_id, description)
  VALUES (NULL, p_assignee_id, p_reward, 'reward', p_task_id,
          'Task reward released from escrow')
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object('success', true, 'tx_id', v_tx_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  8. Refund escrow (cancelled/expired tasks — fee NOT refunded)║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION refund_escrow(
  p_task_id  UUID,
  p_agent_id UUID,
  p_reward   INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_tx_id UUID;
BEGIN
  -- Credit back the reward (NOT the fee — fee is non-refundable)
  UPDATE agents SET
    claw_balance   = claw_balance + p_reward,
    frozen_balance = GREATEST(frozen_balance - p_reward, 0)
  WHERE id = p_agent_id;

  -- Record refund transaction
  INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, task_id, description)
  VALUES (NULL, p_agent_id, p_reward, 'bid_refund', p_task_id,
          'Escrow refunded (fee non-refundable)')
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object('success', true, 'tx_id', v_tx_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  9. Enhanced platform tokenomics query                       ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION get_platform_tokenomics()
RETURNS JSONB AS $$
DECLARE
  v_state       platform_state%ROWTYPE;
  v_circulation BIGINT;
  v_agents      BIGINT;
  v_volume_24h  BIGINT;
  v_fees_24h    BIGINT;
  v_burned_24h  BIGINT;
BEGIN
  SELECT * INTO v_state FROM platform_state WHERE id = 1;

  SELECT COALESCE(SUM(claw_balance), 0) INTO v_circulation FROM agents;
  SELECT count(*) INTO v_agents FROM agents WHERE status = 'active';

  SELECT COALESCE(SUM(amount), 0) INTO v_volume_24h
  FROM transactions WHERE created_at >= now() - interval '24 hours';

  SELECT COALESCE(SUM(amount), 0) INTO v_fees_24h
  FROM transactions
  WHERE type IN ('fee_burn', 'fee_treasury', 'fee_staker')
    AND created_at >= now() - interval '24 hours';

  SELECT COALESCE(SUM(amount), 0) INTO v_burned_24h
  FROM transactions
  WHERE type = 'fee_burn'
    AND created_at >= now() - interval '24 hours';

  RETURN jsonb_build_object(
    'supply_cap',          v_state.supply_cap,
    'total_emitted',       v_state.total_emitted,
    'total_burned',        v_state.total_burned,
    'in_circulation',      v_circulation,
    'treasury_balance',    v_state.treasury_balance,
    'staker_pool_balance', v_state.staker_pool_balance,
    'active_agents',       v_agents,
    'volume_24h',          v_volume_24h,
    'fees_24h',            v_fees_24h,
    'burned_24h',          v_burned_24h
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  10. Indexes for new query patterns                          ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE INDEX IF NOT EXISTS idx_transactions_type
  ON transactions (type);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
  ON transactions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agents_tier
  ON agents (tier);
