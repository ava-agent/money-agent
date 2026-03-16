-- Health check results table for automated lifecycle monitoring
CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'running',  -- running, passed, failed
  duration_ms INTEGER,
  steps JSONB NOT NULL DEFAULT '[]',
  error TEXT,
  publisher_id UUID REFERENCES agents(id),
  executor_id UUID REFERENCES agents(id),
  task_id UUID REFERENCES tasks(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_checks_run_at ON health_checks(run_at DESC);

ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health_checks_read" ON health_checks FOR SELECT USING (true);
CREATE POLICY "health_checks_insert" ON health_checks FOR INSERT WITH CHECK (true);
