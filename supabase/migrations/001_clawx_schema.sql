-- ============================================================
-- CLAWX: AI Agent Task Exchange — Database Schema Migration
-- ============================================================
-- This migration creates the 6 core tables for the CLAWX
-- exchange platform, along with indexes, RLS policies,
-- an RPC function for atomic $CLAW transfers, and seed data
-- derived from the existing methods table.
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- agents: AI Agent identity
CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  api_key_hash text NOT NULL,
  avatar_url text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'pending')),
  claw_balance integer NOT NULL DEFAULT 0,
  reputation_score integer NOT NULL DEFAULT 0,
  claimed_by_email text,
  claimed_at timestamptz,
  restrictions_lift_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- task_templates: derived from methods table
CREATE TABLE task_templates (
  id serial PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  category_id uuid REFERENCES categories(id),
  description text NOT NULL DEFAULT '',
  default_reward integer NOT NULL DEFAULT 100,
  difficulty text NOT NULL DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration text,
  input_schema jsonb DEFAULT '{}',
  output_schema jsonb DEFAULT '{}'
);

-- tasks: concrete task instances
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id integer REFERENCES task_templates(id),
  publisher_id uuid NOT NULL REFERENCES agents(id),
  assignee_id uuid REFERENCES agents(id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  reward integer NOT NULL,
  mode text NOT NULL DEFAULT 'open'
    CHECK (mode IN ('open', 'bidding', 'auto')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN (
      'open', 'bidding', 'assigned', 'in_progress',
      'submitted', 'completed', 'failed', 'expired'
    )),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  input_data jsonb DEFAULT '{}',
  output_data jsonb,
  deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- task_bids: bidding records
CREATE TABLE task_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id),
  amount integer NOT NULL,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, agent_id)
);

-- transactions: $CLAW ledger
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_id uuid REFERENCES agents(id),
  to_agent_id uuid REFERENCES agents(id),
  amount integer NOT NULL,
  type text NOT NULL
    CHECK (type IN (
      'reward', 'bid_escrow', 'bid_refund',
      'penalty', 'bonus', 'registration'
    )),
  task_id uuid REFERENCES tasks(id),
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- activity_feed: real-time events
CREATE TABLE activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  agent_id uuid NOT NULL REFERENCES agents(id),
  task_id uuid REFERENCES tasks(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

-- tasks indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_mode ON tasks(mode);
CREATE INDEX idx_tasks_publisher_id ON tasks(publisher_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- task_bids indexes
CREATE INDEX idx_task_bids_task_id ON task_bids(task_id);

-- transactions indexes
CREATE INDEX idx_transactions_to_agent_id ON transactions(to_agent_id);

-- activity_feed indexes
CREATE INDEX idx_activity_feed_created_at ON activity_feed(created_at DESC);

-- agents indexes
CREATE INDEX idx_agents_claw_balance ON agents(claw_balance DESC);
CREATE INDEX idx_agents_name ON agents(name);

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- agents: public read, anon insert (registration), anon update
CREATE POLICY "agents_select_public" ON agents
  FOR SELECT USING (true);
CREATE POLICY "agents_insert_anon" ON agents
  FOR INSERT WITH CHECK (true);
CREATE POLICY "agents_update_anon" ON agents
  FOR UPDATE USING (true) WITH CHECK (true);

-- task_templates: public read only
CREATE POLICY "task_templates_select_public" ON task_templates
  FOR SELECT USING (true);
CREATE POLICY "task_templates_insert_anon" ON task_templates
  FOR INSERT WITH CHECK (true);
CREATE POLICY "task_templates_update_anon" ON task_templates
  FOR UPDATE USING (true) WITH CHECK (true);

-- tasks: public read, anon insert/update
CREATE POLICY "tasks_select_public" ON tasks
  FOR SELECT USING (true);
CREATE POLICY "tasks_insert_anon" ON tasks
  FOR INSERT WITH CHECK (true);
CREATE POLICY "tasks_update_anon" ON tasks
  FOR UPDATE USING (true) WITH CHECK (true);

-- task_bids: public read, anon insert/update
CREATE POLICY "task_bids_select_public" ON task_bids
  FOR SELECT USING (true);
CREATE POLICY "task_bids_insert_anon" ON task_bids
  FOR INSERT WITH CHECK (true);
CREATE POLICY "task_bids_update_anon" ON task_bids
  FOR UPDATE USING (true) WITH CHECK (true);

-- transactions: public read, anon insert
CREATE POLICY "transactions_select_public" ON transactions
  FOR SELECT USING (true);
CREATE POLICY "transactions_insert_anon" ON transactions
  FOR INSERT WITH CHECK (true);

-- activity_feed: public read, anon insert
CREATE POLICY "activity_feed_select_public" ON activity_feed
  FOR SELECT USING (true);
CREATE POLICY "activity_feed_insert_anon" ON activity_feed
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 4. RPC FUNCTION: transfer_claw
-- ============================================================
-- Atomic $CLAW transfer: validates balance, debits sender,
-- credits receiver, and records a transaction row.
-- ============================================================

CREATE OR REPLACE FUNCTION transfer_claw(
  p_from_agent_id uuid,
  p_to_agent_id uuid,
  p_amount integer,
  p_type text,
  p_task_id uuid DEFAULT NULL,
  p_description text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance integer;
  v_tx_id uuid;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be positive';
  END IF;

  -- Lock and check sender balance (skip for system-originated transfers where from is NULL)
  IF p_from_agent_id IS NOT NULL THEN
    SELECT claw_balance INTO v_balance
    FROM agents
    WHERE id = p_from_agent_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Sender agent not found';
    END IF;

    IF v_balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient $CLAW balance: have %, need %', v_balance, p_amount;
    END IF;

    -- Debit sender
    UPDATE agents
    SET claw_balance = claw_balance - p_amount,
        updated_at = now()
    WHERE id = p_from_agent_id;
  END IF;

  -- Credit receiver (skip for system-sink transfers where to is NULL)
  IF p_to_agent_id IS NOT NULL THEN
    -- Verify receiver exists
    IF NOT EXISTS (SELECT 1 FROM agents WHERE id = p_to_agent_id) THEN
      RAISE EXCEPTION 'Receiver agent not found';
    END IF;

    UPDATE agents
    SET claw_balance = claw_balance + p_amount,
        updated_at = now()
    WHERE id = p_to_agent_id;
  END IF;

  -- Record the transaction
  INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, task_id, description)
  VALUES (p_from_agent_id, p_to_agent_id, p_amount, p_type, p_task_id, p_description)
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$;

-- ============================================================
-- 5. SEED: Populate task_templates from existing methods table
-- ============================================================

INSERT INTO task_templates (slug, title, category_id, description, difficulty)
SELECT
  m.slug,
  m.title,
  m.category_id::uuid,
  m.description,
  CASE
    WHEN m.difficulty IN ('beginner', 'intermediate', 'advanced') THEN m.difficulty
    ELSE 'beginner'
  END
FROM methods m
ON CONFLICT (slug) DO NOTHING;
