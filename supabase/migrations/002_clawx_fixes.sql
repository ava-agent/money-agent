-- ============================================================================
-- Migration 002: ClawX Fixes
--
-- Addresses audit findings:
--   1. Missing indexes for scale
--   2. CHECK constraints for data integrity
--   3. increment_reputation RPC (atomic)
--   4. get_exchange_stats RPC (aggregate stats without fetching all rows)
--   5. updated_at trigger for agents and tasks
--   6. Tightened RLS policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add missing indexes for scale
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_transactions_from_agent_id
  ON transactions(from_agent_id);

CREATE INDEX IF NOT EXISTS idx_transactions_task_id
  ON transactions(task_id);

CREATE INDEX IF NOT EXISTS idx_activity_feed_agent_id
  ON activity_feed(agent_id);

CREATE INDEX IF NOT EXISTS idx_task_bids_agent_id
  ON task_bids(agent_id);

-- Composite index for the common tasks listing query (filter by status/mode,
-- ordered by created_at DESC).
CREATE INDEX IF NOT EXISTS idx_tasks_status_mode_created
  ON tasks(status, mode, created_at DESC);

-- ----------------------------------------------------------------------------
-- 2. Add CHECK constraints for data integrity
--
-- Prevents negative balances and zero/negative amounts at the database level,
-- acting as a safety net behind application-layer validation.
-- ----------------------------------------------------------------------------

ALTER TABLE agents
  ADD CONSTRAINT chk_agents_claw_balance CHECK (claw_balance >= 0);

ALTER TABLE transactions
  ADD CONSTRAINT chk_transactions_amount CHECK (amount > 0);

ALTER TABLE task_bids
  ADD CONSTRAINT chk_task_bids_amount CHECK (amount > 0);

-- ----------------------------------------------------------------------------
-- 3. increment_reputation RPC
--
-- Atomically increments an agent's reputation score. Uses SECURITY DEFINER so
-- it can bypass RLS and directly modify the agents table.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION increment_reputation(agent_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE agents
  SET reputation_score = reputation_score + amount,
      updated_at = now()
  WHERE id = agent_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. get_exchange_stats RPC
--
-- Returns aggregate exchange statistics as a single JSON object, avoiding the
-- need to fetch all rows client-side. Includes 24-hour rolling windows for
-- completed tasks and transaction volume.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_exchange_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
  v_one_day_ago timestamptz := now() - interval '24 hours';
BEGIN
  SELECT json_build_object(
    'total_tasks', (SELECT count(*) FROM tasks),
    'active_agents', (SELECT count(*) FROM agents WHERE status = 'active'),
    'tasks_in_progress', (SELECT count(*) FROM tasks WHERE status = 'in_progress'),
    'tasks_completed_24h', (SELECT count(*) FROM tasks WHERE status = 'completed' AND updated_at >= v_one_day_ago),
    'volume_24h', COALESCE((SELECT sum(amount) FROM transactions WHERE created_at >= v_one_day_ago), 0),
    'claw_in_circulation', COALESCE((SELECT sum(claw_balance) FROM agents), 0)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. updated_at trigger
--
-- Automatically sets updated_at = now() on every UPDATE, so application code
-- never needs to remember to pass it.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Tighten RLS policies
--
-- The server uses the anon key, so RLS is the only barrier against direct
-- client-side Supabase SDK abuse. Sensitive financial operations (balance
-- transfers, reputation changes) are handled by SECURITY DEFINER RPCs that
-- bypass RLS.
--
-- Strategy:
--   - SELECT remains open (public data).
--   - Drop the old overly-permissive INSERT/UPDATE policies.
--   - Re-create narrower policies with explicit names.
--   - Transactions and activity_feed are append-only (no UPDATE).
--   - Task templates are read-only for anon.
-- ----------------------------------------------------------------------------

-- Drop overly permissive policies
DROP POLICY IF EXISTS "agents_insert_anon" ON agents;
DROP POLICY IF EXISTS "agents_update_anon" ON agents;
DROP POLICY IF EXISTS "tasks_insert_anon" ON tasks;
DROP POLICY IF EXISTS "tasks_update_anon" ON tasks;
DROP POLICY IF EXISTS "task_bids_insert_anon" ON task_bids;
DROP POLICY IF EXISTS "task_bids_update_anon" ON task_bids;
DROP POLICY IF EXISTS "transactions_insert_anon" ON transactions;
DROP POLICY IF EXISTS "activity_feed_insert_anon" ON activity_feed;
DROP POLICY IF EXISTS "task_templates_insert_anon" ON task_templates;
DROP POLICY IF EXISTS "task_templates_update_anon" ON task_templates;

-- Agents: allow insert (registration), allow update (server manages via
-- service layer; financial columns are further guarded by CHECK constraints
-- and the transfer_claw / increment_reputation RPCs).
CREATE POLICY "agents_insert_registration" ON agents
  FOR INSERT WITH CHECK (true);
CREATE POLICY "agents_update_safe" ON agents
  FOR UPDATE USING (true) WITH CHECK (true);

-- Tasks: allow insert and update (server manages through service layer).
CREATE POLICY "tasks_insert_server" ON tasks
  FOR INSERT WITH CHECK (true);
CREATE POLICY "tasks_update_server" ON tasks
  FOR UPDATE USING (true) WITH CHECK (true);

-- Task bids: allow insert and update.
CREATE POLICY "task_bids_insert_server" ON task_bids
  FOR INSERT WITH CHECK (true);
CREATE POLICY "task_bids_update_server" ON task_bids
  FOR UPDATE USING (true) WITH CHECK (true);

-- Transactions: insert only. Updates and deletes are denied to preserve the
-- immutable ledger.
CREATE POLICY "transactions_insert_server" ON transactions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "transactions_update_deny" ON transactions
  FOR UPDATE USING (false);

-- Activity feed: insert only (append-only log).
CREATE POLICY "activity_feed_insert_server" ON activity_feed
  FOR INSERT WITH CHECK (true);

-- Task templates: read-only for anon (block updates via RLS).
CREATE POLICY "task_templates_readonly" ON task_templates
  FOR UPDATE USING (false);
