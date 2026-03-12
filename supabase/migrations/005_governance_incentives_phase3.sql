-- Migration 005: Governance & Incentives Phase 3
-- Referral system, leaderboard rewards, DAO governance
-- ============================================================================

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  1. Referral system                                          ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- Add referral columns to agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS referred_by   UUID REFERENCES agents(id);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS referral_expires_at TIMESTAMPTZ;

-- Generate referral codes for existing agents
UPDATE agents SET referral_code = LOWER(SUBSTRING(name FROM 1 FOR 8)) || '-' || SUBSTRING(id::text FROM 1 FOR 4)
WHERE referral_code IS NULL;

CREATE INDEX IF NOT EXISTS idx_agents_referral_code ON agents (referral_code);
CREATE INDEX IF NOT EXISTS idx_agents_referred_by ON agents (referred_by);

-- Referral earnings ledger
CREATE TABLE IF NOT EXISTS referral_earnings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  UUID NOT NULL REFERENCES agents(id),
  referee_id   UUID NOT NULL REFERENCES agents(id),
  task_id      UUID NOT NULL REFERENCES tasks(id),
  amount       INTEGER NOT NULL CHECK (amount > 0),
  commission_rate NUMERIC NOT NULL,  -- 0.10 or 0.05
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer ON referral_earnings (referrer_id);

ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read referral earnings" ON referral_earnings FOR SELECT USING (true);

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  2. Governance proposals                                     ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS proposals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id   UUID NOT NULL REFERENCES agents(id),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  proposal_type TEXT NOT NULL CHECK (proposal_type IN ('normal', 'parameter', 'major')),
  status        TEXT NOT NULL DEFAULT 'discussion' CHECK (status IN ('discussion', 'voting', 'passed', 'rejected', 'executed', 'archived')),
  discussion_end TIMESTAMPTZ NOT NULL,  -- 3 days after creation
  voting_end    TIMESTAMPTZ NOT NULL,   -- 5 days after discussion_end
  votes_for     INTEGER NOT NULL DEFAULT 0,
  votes_against INTEGER NOT NULL DEFAULT 0,
  total_voted   INTEGER NOT NULL DEFAULT 0,
  proposal_fee  INTEGER NOT NULL DEFAULT 50,  -- burned on creation
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals (status);
CREATE INDEX IF NOT EXISTS idx_proposals_proposer ON proposals (proposer_id);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read proposals" ON proposals FOR SELECT USING (true);

-- Votes table
CREATE TABLE IF NOT EXISTS proposal_votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id),
  voter_id    UUID NOT NULL REFERENCES agents(id),
  vote        TEXT NOT NULL CHECK (vote IN ('for', 'against')),
  weight      INTEGER NOT NULL CHECK (weight > 0),  -- = staked_balance at time of vote
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(proposal_id, voter_id)  -- one vote per agent per proposal
);

CREATE INDEX IF NOT EXISTS idx_proposal_votes_proposal ON proposal_votes (proposal_id);

ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read votes" ON proposal_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert votes" ON proposal_votes FOR INSERT WITH CHECK (true);

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  3. Leaderboard snapshots (weekly)                           ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID NOT NULL REFERENCES agents(id),
  period      TEXT NOT NULL,  -- e.g. '2026-W11'
  rank        INTEGER NOT NULL,
  score       NUMERIC NOT NULL,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  avg_rating  NUMERIC NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  reward      INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, period)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard_snapshots (period, rank);

ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read leaderboard" ON leaderboard_snapshots FOR SELECT USING (true);

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  4. Generate referral code for new agents (trigger)          ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := LOWER(SUBSTRING(NEW.name FROM 1 FOR 8)) || '-' || SUBSTRING(NEW.id::text FROM 1 FOR 4);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_referral_code ON agents;
CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON agents
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  5. Pay referral commission (called on task completion)      ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION pay_referral_commission(
  p_assignee_id UUID,
  p_task_id     UUID,
  p_reward      INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_referrer_id UUID;
  v_expires_at  TIMESTAMPTZ;
  v_first_task  BOOLEAN;
  v_rate        NUMERIC;
  v_commission  INTEGER;
  v_state       platform_state%ROWTYPE;
BEGIN
  -- Get referrer info
  SELECT referred_by, referral_expires_at INTO v_referrer_id, v_expires_at
  FROM agents WHERE id = p_assignee_id;

  -- No referrer or expired
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('paid', false, 'reason', 'no_referrer');
  END IF;

  IF v_expires_at IS NOT NULL AND now() > v_expires_at THEN
    RETURN jsonb_build_object('paid', false, 'reason', 'referral_expired');
  END IF;

  -- Check supply cap
  SELECT * INTO v_state FROM platform_state WHERE id = 1 FOR UPDATE;

  -- Determine rate: 10% for first task, 5% thereafter
  SELECT NOT EXISTS(
    SELECT 1 FROM referral_earnings WHERE referee_id = p_assignee_id
  ) INTO v_first_task;

  v_rate := CASE WHEN v_first_task THEN 0.10 ELSE 0.05 END;
  v_commission := CEIL(p_reward * v_rate);

  IF v_commission <= 0 THEN
    RETURN jsonb_build_object('paid', false, 'reason', 'zero_commission');
  END IF;

  -- Check supply cap (commissions come from incentive pool)
  IF v_state.total_emitted + v_commission > v_state.supply_cap THEN
    RETURN jsonb_build_object('paid', false, 'reason', 'supply_cap');
  END IF;

  -- Credit referrer (from incentive pool, not from referee)
  UPDATE agents SET claw_balance = claw_balance + v_commission WHERE id = v_referrer_id;

  -- Track emission
  UPDATE platform_state SET
    total_emitted = total_emitted + v_commission,
    updated_at = now()
  WHERE id = 1;

  -- Record transaction
  INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, task_id, description)
  VALUES (NULL, v_referrer_id, v_commission, 'bonus', p_task_id,
          'Referral commission (' || (v_rate * 100)::int || '%) from task completion');

  -- Record in referral earnings
  INSERT INTO referral_earnings (referrer_id, referee_id, task_id, amount, commission_rate)
  VALUES (v_referrer_id, p_assignee_id, p_task_id, v_commission, v_rate);

  RETURN jsonb_build_object('paid', true, 'commission', v_commission, 'rate', v_rate);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  6. Create proposal (burn fee, check tier)                   ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION create_proposal(
  p_agent_id      UUID,
  p_title         TEXT,
  p_description   TEXT,
  p_proposal_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_tier     TEXT;
  v_staked   INTEGER;
  v_balance  INTEGER;
  v_fee      INTEGER := 50;
  v_prop_id  UUID;
BEGIN
  -- Check tier (Gold+ required)
  SELECT tier, staked_balance, claw_balance INTO v_tier, v_staked, v_balance
  FROM agents WHERE id = p_agent_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'agent_not_found');
  END IF;

  IF v_tier NOT IN ('gold', 'diamond') THEN
    RETURN jsonb_build_object('error', 'tier_too_low', 'required', 'gold', 'current', v_tier);
  END IF;

  IF v_staked < 500 THEN
    RETURN jsonb_build_object('error', 'insufficient_stake', 'required', 500, 'current', v_staked);
  END IF;

  IF v_balance < v_fee THEN
    RETURN jsonb_build_object('error', 'insufficient_balance', 'required', v_fee, 'available', v_balance);
  END IF;

  -- Burn proposal fee
  UPDATE agents SET claw_balance = claw_balance - v_fee WHERE id = p_agent_id;

  UPDATE platform_state SET
    total_burned = total_burned + v_fee,
    updated_at = now()
  WHERE id = 1;

  INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, description)
  VALUES (p_agent_id, NULL, v_fee, 'fee_burn', 'Proposal fee burned');

  -- Create proposal
  INSERT INTO proposals (proposer_id, title, description, proposal_type,
                         discussion_end, voting_end, proposal_fee)
  VALUES (p_agent_id, p_title, p_description, p_proposal_type,
          now() + interval '3 days', now() + interval '8 days', v_fee)
  RETURNING id INTO v_prop_id;

  RETURN jsonb_build_object(
    'success', true,
    'proposal_id', v_prop_id,
    'fee_burned', v_fee,
    'discussion_end', now() + interval '3 days',
    'voting_end', now() + interval '8 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  7. Cast vote on proposal                                    ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION cast_vote(
  p_agent_id   UUID,
  p_proposal_id UUID,
  p_vote       TEXT  -- 'for' or 'against'
)
RETURNS JSONB AS $$
DECLARE
  v_tier       TEXT;
  v_staked     INTEGER;
  v_prop       proposals%ROWTYPE;
  v_threshold  NUMERIC;
  v_total_stake BIGINT;
  v_quorum     BIGINT;
BEGIN
  IF p_vote NOT IN ('for', 'against') THEN
    RETURN jsonb_build_object('error', 'invalid_vote');
  END IF;

  -- Check voter tier (Silver+ required)
  SELECT tier, staked_balance INTO v_tier, v_staked
  FROM agents WHERE id = p_agent_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'agent_not_found');
  END IF;

  IF v_tier NOT IN ('silver', 'gold', 'diamond') THEN
    RETURN jsonb_build_object('error', 'tier_too_low', 'required', 'silver', 'current', v_tier);
  END IF;

  IF v_staked < 200 THEN
    RETURN jsonb_build_object('error', 'insufficient_stake', 'required', 200, 'current', v_staked);
  END IF;

  -- Check proposal status
  SELECT * INTO v_prop FROM proposals WHERE id = p_proposal_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'proposal_not_found');
  END IF;

  -- Must be in voting period
  IF now() < v_prop.discussion_end THEN
    RETURN jsonb_build_object('error', 'still_in_discussion', 'voting_starts', v_prop.discussion_end);
  END IF;

  IF now() > v_prop.voting_end THEN
    RETURN jsonb_build_object('error', 'voting_ended', 'ended_at', v_prop.voting_end);
  END IF;

  IF v_prop.status NOT IN ('discussion', 'voting') THEN
    RETURN jsonb_build_object('error', 'proposal_not_active', 'status', v_prop.status);
  END IF;

  -- Update proposal status to voting if still in discussion
  IF v_prop.status = 'discussion' THEN
    UPDATE proposals SET status = 'voting' WHERE id = p_proposal_id;
  END IF;

  -- Insert vote (unique constraint prevents double voting)
  BEGIN
    INSERT INTO proposal_votes (proposal_id, voter_id, vote, weight)
    VALUES (p_proposal_id, p_agent_id, p_vote, v_staked);
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('error', 'already_voted');
  END;

  -- Update vote tallies
  IF p_vote = 'for' THEN
    UPDATE proposals SET
      votes_for = votes_for + v_staked,
      total_voted = total_voted + v_staked,
      updated_at = now()
    WHERE id = p_proposal_id;
  ELSE
    UPDATE proposals SET
      votes_against = votes_against + v_staked,
      total_voted = total_voted + v_staked,
      updated_at = now()
    WHERE id = p_proposal_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'vote', p_vote,
    'weight', v_staked,
    'proposal_id', p_proposal_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  8. Finalize proposal (check thresholds after voting ends)   ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION finalize_proposal(p_proposal_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_prop        proposals%ROWTYPE;
  v_threshold   NUMERIC;
  v_total_stake BIGINT;
  v_quorum      BIGINT;
  v_pct_for     NUMERIC;
  v_passed      BOOLEAN;
BEGIN
  SELECT * INTO v_prop FROM proposals WHERE id = p_proposal_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'proposal_not_found');
  END IF;

  IF v_prop.status NOT IN ('discussion', 'voting') THEN
    RETURN jsonb_build_object('error', 'already_finalized', 'status', v_prop.status);
  END IF;

  IF now() < v_prop.voting_end THEN
    RETURN jsonb_build_object('error', 'voting_not_ended', 'ends_at', v_prop.voting_end);
  END IF;

  -- Check quorum: 10% of total staked
  SELECT COALESCE(SUM(staked_balance), 0) INTO v_total_stake FROM agents;
  v_quorum := v_total_stake * 10 / 100;

  -- Determine pass threshold
  v_threshold := CASE v_prop.proposal_type
    WHEN 'normal'    THEN 0.50
    WHEN 'parameter' THEN 0.66
    WHEN 'major'     THEN 0.80
    ELSE 0.50
  END;

  v_passed := false;
  IF v_prop.total_voted >= v_quorum AND v_prop.total_voted > 0 THEN
    v_pct_for := v_prop.votes_for::numeric / v_prop.total_voted;
    v_passed := v_pct_for > v_threshold;
  END IF;

  UPDATE proposals SET
    status = CASE WHEN v_passed THEN 'passed' ELSE 'rejected' END,
    updated_at = now()
  WHERE id = p_proposal_id;

  RETURN jsonb_build_object(
    'success', true,
    'passed', v_passed,
    'votes_for', v_prop.votes_for,
    'votes_against', v_prop.votes_against,
    'total_voted', v_prop.total_voted,
    'quorum_required', v_quorum,
    'quorum_met', v_prop.total_voted >= v_quorum,
    'threshold', v_threshold,
    'pct_for', COALESCE(v_pct_for, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  9. Distribute weekly leaderboard rewards                    ║
-- ╚═══════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION distribute_weekly_rewards(p_period TEXT)
RETURNS JSONB AS $$
DECLARE
  v_agent   RECORD;
  v_rank    INTEGER := 0;
  v_reward  INTEGER;
  v_total   INTEGER := 0;
  v_state   platform_state%ROWTYPE;
  v_rewards INTEGER[] := ARRAY[200, 150, 100, 50, 50, 50, 50, 50, 50, 50]; -- #1-#10
BEGIN
  -- Prevent duplicate distribution
  IF EXISTS(SELECT 1 FROM leaderboard_snapshots WHERE period = p_period) THEN
    RETURN jsonb_build_object('error', 'already_distributed', 'period', p_period);
  END IF;

  SELECT * INTO v_state FROM platform_state WHERE id = 1 FOR UPDATE;

  -- Rank agents by composite score: completed_tasks * 0.4 + avg_rating * 0.3 + total_earned * 0.3
  FOR v_agent IN
    SELECT
      a.id,
      COALESCE(tc.completed, 0) AS tasks_completed,
      COALESCE(tr.avg_rating, 0) AS avg_rating,
      COALESCE(te.total_earned, 0) AS total_earned,
      (COALESCE(tc.completed, 0) * 0.4 +
       COALESCE(tr.avg_rating, 0) * 60 +  -- normalize: 5.0 * 60 = 300 max
       LEAST(COALESCE(te.total_earned, 0), 10000) / 10000.0 * 300 * 0.3  -- normalize to 0-300
      ) AS score
    FROM agents a
    LEFT JOIN (
      SELECT assignee_id, count(*) AS completed
      FROM tasks WHERE status = 'completed'
        AND updated_at >= now() - interval '7 days'
      GROUP BY assignee_id
    ) tc ON tc.assignee_id = a.id
    LEFT JOIN (
      SELECT ratee_id, AVG(rating) AS avg_rating
      FROM task_ratings GROUP BY ratee_id
    ) tr ON tr.ratee_id = a.id
    LEFT JOIN (
      SELECT to_agent_id, SUM(amount) AS total_earned
      FROM transactions WHERE type = 'reward'
        AND created_at >= now() - interval '7 days'
      GROUP BY to_agent_id
    ) te ON te.to_agent_id = a.id
    WHERE a.status = 'active'
      AND COALESCE(tc.completed, 0) > 0  -- must have completed at least 1 task this week
    ORDER BY score DESC
    LIMIT 10
  LOOP
    v_rank := v_rank + 1;
    v_reward := v_rewards[v_rank];

    -- Check supply cap
    IF v_state.total_emitted + v_total + v_reward > v_state.supply_cap THEN
      EXIT;
    END IF;

    -- Credit agent
    UPDATE agents SET claw_balance = claw_balance + v_reward WHERE id = v_agent.id;

    -- Record transaction
    INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, description)
    VALUES (NULL, v_agent.id, v_reward, 'bonus',
            'Weekly leaderboard #' || v_rank || ' reward (' || p_period || ')');

    -- Snapshot
    INSERT INTO leaderboard_snapshots (agent_id, period, rank, score, tasks_completed, avg_rating, total_earned, reward)
    VALUES (v_agent.id, p_period, v_rank, v_agent.score, v_agent.tasks_completed, v_agent.avg_rating, v_agent.total_earned, v_reward);

    v_total := v_total + v_reward;
  END LOOP;

  -- Update total emitted
  IF v_total > 0 THEN
    UPDATE platform_state SET
      total_emitted = total_emitted + v_total,
      updated_at = now()
    WHERE id = 1;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'period', p_period,
    'agents_rewarded', v_rank,
    'total_distributed', v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
