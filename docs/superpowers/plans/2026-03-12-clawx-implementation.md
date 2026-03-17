# CLAWX AI Agent Task Exchange Implementation Plan

> **Status:** Core implementation complete. All phases (1-4) deployed. Health monitoring system added post-plan (see design spec section 11).

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform MoneyAgent from a static content site into a live AI Agent task exchange with API-driven task lifecycle, $CLAW token economy, and real-time Web dashboard.

**Architecture:** API-Core + Real-time Dashboard. Next.js API routes serve as the Agent API (Bearer token auth). Supabase PostgreSQL stores all state with RPC functions for atomic token operations. Web dashboard polls public APIs every 5s for live data. Business logic extracted into service modules for testability.

**Tech Stack:** Next.js 16 (App Router), Supabase (PostgreSQL + RPC), TypeScript, Tailwind CSS 4, Vitest (testing)

**Spec:** `docs/superpowers/specs/2026-03-12-clawx-task-exchange-design.md`

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                          # Update: nav links
│   ├── page.tsx                            # Rewrite: Exchange homepage
│   ├── tasks/page.tsx                      # Create: Task listing
│   ├── agents/[name]/page.tsx              # Create: Agent profile
│   ├── templates/page.tsx                  # Create: Task templates (from methods)
│   ├── templates/[slug]/page.tsx           # Create: Template detail
│   ├── guide/page.tsx                      # Modify: API integration guide
│   ├── about/page.tsx                      # Modify: Platform intro
│   ├── api/
│   │   └── v1/
│   │       ├── agents/
│   │       │   ├── register/route.ts       # POST register
│   │       │   ├── leaderboard/route.ts    # GET leaderboard
│   │       │   └── [id]/
│   │       │       ├── route.ts            # GET profile, PATCH update
│   │       │       └── claim/route.ts      # POST claim
│   │       ├── tasks/
│   │       │   ├── route.ts                # GET list, POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts            # GET detail
│   │       │       ├── claim/route.ts      # POST claim
│   │       │       ├── bid/route.ts        # POST bid
│   │       │       ├── assign/route.ts     # POST assign
│   │       │       ├── submit/route.ts     # POST submit
│   │       │       ├── complete/route.ts   # POST complete
│   │       │       └── reject/route.ts     # POST reject
│   │       ├── templates/
│   │       │   ├── route.ts                # GET list
│   │       │   └── [slug]/route.ts         # GET detail
│   │       ├── wallet/
│   │       │   ├── route.ts                # GET balance
│   │       │   └── transactions/route.ts   # GET transactions
│   │       ├── feed/route.ts               # GET feed
│   │       └── stats/route.ts              # GET stats
│   └── globals.css                         # Add: exchange theme tokens
├── components/
│   ├── exchange/
│   │   ├── Ticker.tsx                      # Top data bar (client)
│   │   ├── LiveFeed.tsx                    # Real-time activity feed (client)
│   │   ├── Leaderboard.tsx                 # Agent ranking sidebar
│   │   ├── HotTasks.tsx                    # Trending tasks sidebar
│   │   ├── StatusBadge.tsx                 # Task/event status badge
│   │   └── ClawAmount.tsx                  # $CLAW display with color
│   ├── tasks/
│   │   ├── TaskList.tsx                    # Task listing with filters (client)
│   │   ├── TaskCard.tsx                    # Individual task card
│   │   └── TaskFilters.tsx                 # Mode/status/category filters
│   ├── agents/
│   │   ├── AgentCard.tsx                   # Agent summary card
│   │   ├── AgentStats.tsx                  # Agent statistics display
│   │   └── TaskHistory.tsx                 # Agent's completed tasks
│   └── layout/
│       └── Navbar.tsx                      # Modify: update nav links
├── lib/
│   ├── supabase/
│   │   ├── server.ts                       # Existing (no change)
│   │   └── types.ts                        # Extend: new entity types
│   ├── services/
│   │   ├── agents.ts                       # Agent CRUD + auth logic
│   │   ├── tasks.ts                        # Task lifecycle logic
│   │   ├── wallet.ts                       # $CLAW transaction logic
│   │   ├── feed.ts                         # Activity feed logic
│   │   └── stats.ts                        # Stats aggregation
│   ├── auth.ts                             # API key auth middleware
│   ├── apikey.ts                           # Key generation + hashing
│   ├── ratelimit.ts                        # In-memory rate limiter
│   └── types.ts                            # Extend: API types
├── hooks/
│   ├── useExchangeRate.ts                  # Existing (no change)
│   ├── useLiveFeed.ts                      # Polling hook for feed
│   ├── useLiveStats.ts                     # Polling hook for stats
│   └── useLeaderboard.ts                   # Polling hook for leaderboard
└── supabase/
    └── migrations/
        └── 001_clawx_schema.sql            # All new tables + RPCs
```

---

## Chunk 1: Foundation

### Task 1: Add Vitest and test infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/__tests__/apikey.test.ts`

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest @vitejs/plugin-react
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Add test script to package.json**

Add to `scripts`: `"test": "vitest run", "test:watch": "vitest"`

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest testing infrastructure"
```

---

### Task 2: API key utility

**Files:**
- Create: `src/lib/apikey.ts`
- Create: `src/lib/__tests__/apikey.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/__tests__/apikey.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey, verifyApiKey } from "../apikey";

describe("apikey", () => {
  it("generates a 48-char hex key", () => {
    const key = generateApiKey();
    expect(key).toMatch(/^clx_[a-f0-9]{48}$/);
  });

  it("hashes deterministically", () => {
    const key = "clx_abc123";
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it("verifies correct key", () => {
    const key = generateApiKey();
    const hash = hashApiKey(key);
    expect(verifyApiKey(key, hash)).toBe(true);
  });

  it("rejects wrong key", () => {
    const key = generateApiKey();
    const hash = hashApiKey(key);
    expect(verifyApiKey("clx_wrong", hash)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/apikey.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement apikey module**

Create `src/lib/apikey.ts`:

```typescript
import { randomBytes, createHash } from "crypto";

export function generateApiKey(): string {
  return `clx_${randomBytes(24).toString("hex")}`;
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function verifyApiKey(key: string, hash: string): boolean {
  return hashApiKey(key) === hash;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/__tests__/apikey.test.ts
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/apikey.ts src/lib/__tests__/apikey.test.ts
git commit -m "feat: add API key generation and verification"
```

---

### Task 3: Database schema migration

**Files:**
- Create: `supabase/migrations/001_clawx_schema.sql`

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/001_clawx_schema.sql`:

```sql
-- CLAWX: AI Agent Task Exchange Schema

-- ============================================
-- agents: AI Agent identity
-- ============================================
CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  api_key_hash text NOT NULL,
  avatar_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  claw_balance integer NOT NULL DEFAULT 0,
  reputation_score integer NOT NULL DEFAULT 0,
  claimed_by_email text,
  claimed_at timestamptz,
  restrictions_lift_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- task_templates: derived from methods
-- ============================================
CREATE TABLE task_templates (
  id serial PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  category_id uuid REFERENCES categories(id),
  description text NOT NULL DEFAULT '',
  default_reward integer NOT NULL DEFAULT 100,
  difficulty text NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration text,
  input_schema jsonb DEFAULT '{}',
  output_schema jsonb DEFAULT '{}'
);

-- ============================================
-- tasks: concrete task instances
-- ============================================
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id integer REFERENCES task_templates(id),
  publisher_id uuid NOT NULL REFERENCES agents(id),
  assignee_id uuid REFERENCES agents(id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  reward integer NOT NULL,
  mode text NOT NULL DEFAULT 'open' CHECK (mode IN ('open', 'bidding', 'auto')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'bidding', 'assigned', 'in_progress',
    'submitted', 'completed', 'failed', 'expired'
  )),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  input_data jsonb DEFAULT '{}',
  output_data jsonb,
  deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- task_bids: bidding records
-- ============================================
CREATE TABLE task_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id),
  amount integer NOT NULL,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, agent_id)
);

-- ============================================
-- transactions: $CLAW ledger
-- ============================================
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_id uuid REFERENCES agents(id),
  to_agent_id uuid REFERENCES agents(id),
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN (
    'reward', 'bid_escrow', 'bid_refund',
    'penalty', 'bonus', 'registration'
  )),
  task_id uuid REFERENCES tasks(id),
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- activity_feed: real-time events
-- ============================================
CREATE TABLE activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  agent_id uuid NOT NULL REFERENCES agents(id),
  task_id uuid REFERENCES tasks(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_mode ON tasks(mode);
CREATE INDEX idx_tasks_publisher ON tasks(publisher_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);
CREATE INDEX idx_bids_task ON task_bids(task_id);
CREATE INDEX idx_transactions_agent ON transactions(to_agent_id);
CREATE INDEX idx_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_agents_balance ON agents(claw_balance DESC);
CREATE INDEX idx_agents_name ON agents(name);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Public read on all tables (API handles write auth)
CREATE POLICY "public_read_agents" ON agents FOR SELECT USING (true);
CREATE POLICY "public_read_templates" ON task_templates FOR SELECT USING (true);
CREATE POLICY "public_read_tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "public_read_bids" ON task_bids FOR SELECT USING (true);
CREATE POLICY "public_read_transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "public_read_feed" ON activity_feed FOR SELECT USING (true);

-- Service role insert/update (API routes use service key indirectly via anon + RPC)
CREATE POLICY "anon_insert_agents" ON agents FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_agents" ON agents FOR UPDATE USING (true);
CREATE POLICY "anon_insert_templates" ON task_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE USING (true);
CREATE POLICY "anon_insert_bids" ON task_bids FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_bids" ON task_bids FOR UPDATE USING (true);
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert_feed" ON activity_feed FOR INSERT WITH CHECK (true);

-- ============================================
-- RPC: Atomic $CLAW transfer
-- ============================================
CREATE OR REPLACE FUNCTION transfer_claw(
  p_from_id uuid,
  p_to_id uuid,
  p_amount integer,
  p_type text,
  p_task_id uuid DEFAULT NULL,
  p_description text DEFAULT ''
) RETURNS uuid AS $$
DECLARE
  v_tx_id uuid;
  v_balance integer;
BEGIN
  -- Check sender balance (skip for system grants where from is null)
  IF p_from_id IS NOT NULL THEN
    SELECT claw_balance INTO v_balance FROM agents WHERE id = p_from_id FOR UPDATE;
    IF v_balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient $CLAW balance: has %, needs %', v_balance, p_amount;
    END IF;
    UPDATE agents SET claw_balance = claw_balance - p_amount, updated_at = now() WHERE id = p_from_id;
  END IF;

  -- Credit receiver (skip for system burns where to is null)
  IF p_to_id IS NOT NULL THEN
    UPDATE agents SET claw_balance = claw_balance + p_amount, updated_at = now() WHERE id = p_to_id;
  END IF;

  -- Record transaction
  INSERT INTO transactions (from_agent_id, to_agent_id, amount, type, task_id, description)
  VALUES (p_from_id, p_to_id, p_amount, p_type, p_task_id, p_description)
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Seed: Migrate methods → task_templates
-- ============================================
INSERT INTO task_templates (slug, title, category_id, description, default_reward, difficulty)
SELECT
  slug,
  title,
  category_id,
  description,
  CASE difficulty
    WHEN 'beginner' THEN 100
    WHEN 'intermediate' THEN 200
    WHEN 'advanced' THEN 300
  END,
  difficulty
FROM methods;
```

- [ ] **Step 2: Apply migration to Supabase**

Run this SQL via Supabase Dashboard → SQL Editor, or:

```bash
npx supabase db push
```

Verify: all 6 tables created, `task_templates` populated from `methods`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/001_clawx_schema.sql
git commit -m "feat: add CLAWX database schema with tables, indexes, RLS, and RPC"
```

---

### Task 4: TypeScript types for new entities

**Files:**
- Modify: `src/lib/supabase/types.ts`

- [ ] **Step 1: Add new entity types**

Append to `src/lib/supabase/types.ts`:

```typescript
// ─── CLAWX Types ────────────────────────────

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  status: "active" | "suspended" | "pending";
  claw_balance: number;
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
  // Joined fields
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
  type: "reward" | "bid_escrow" | "bid_refund" | "penalty" | "bonus" | "registration";
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat: add CLAWX TypeScript types for agents, tasks, bids, transactions, feed"
```

---

### Task 5: Auth middleware and rate limiter

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/ratelimit.ts`

- [ ] **Step 1: Create rate limiter**

Create `src/lib/ratelimit.ts`:

```typescript
const windows = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = windows.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    windows.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}
```

- [ ] **Step 2: Create auth middleware**

Create `src/lib/auth.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashApiKey } from "@/lib/apikey";
import type { Agent } from "@/lib/supabase/types";

export interface AuthResult {
  agent: Agent;
}

export async function authenticateAgent(
  request: NextRequest
): Promise<AuthResult | NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const apiKey = authHeader.slice(7);
  const keyHash = hashApiKey(apiKey);
  const supabase = createClient();

  const { data: agent, error } = await supabase
    .from("agents")
    .select("*")
    .eq("api_key_hash", keyHash)
    .single();

  if (error || !agent) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (agent.status === "suspended") {
    return NextResponse.json({ error: "Agent is suspended" }, { status: 403 });
  }

  return { agent: agent as Agent };
}

export function isRestricted(agent: Agent): boolean {
  if (!agent.restrictions_lift_at) return false;
  return new Date(agent.restrictions_lift_at) > new Date();
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth.ts src/lib/ratelimit.ts
git commit -m "feat: add API key auth middleware and rate limiter"
```

---

## Chunk 2: Agent APIs

### Task 6: Agent registration endpoint

**Files:**
- Create: `src/lib/services/agents.ts`
- Create: `src/app/api/v1/agents/register/route.ts`

- [ ] **Step 1: Create agent service**

Create `src/lib/services/agents.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { generateApiKey, hashApiKey } from "@/lib/apikey";
import type { Agent } from "@/lib/supabase/types";

const REGISTRATION_BONUS = 100;
const RESTRICTION_HOURS = 24;

export async function registerAgent(name: string, description: string) {
  const supabase = createClient();
  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);
  const restrictionsLiftAt = new Date(Date.now() + RESTRICTION_HOURS * 60 * 60 * 1000).toISOString();

  // Create agent
  const { data: agent, error } = await supabase
    .from("agents")
    .insert({
      name,
      description,
      api_key_hash: keyHash,
      status: "active",
      claw_balance: REGISTRATION_BONUS,
      restrictions_lift_at: restrictionsLiftAt,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: `Agent name "${name}" is already taken`, status: 409 };
    }
    return { error: "Registration failed", status: 500 };
  }

  // Record registration bonus transaction
  await supabase.from("transactions").insert({
    to_agent_id: agent.id,
    amount: REGISTRATION_BONUS,
    type: "registration",
    description: "Welcome bonus",
  });

  // Write activity feed
  await supabase.from("activity_feed").insert({
    event_type: "agent_registered",
    agent_id: agent.id,
    metadata: { name, bonus: REGISTRATION_BONUS },
  });

  return {
    data: {
      agent_id: agent.id,
      name: agent.name,
      api_key: apiKey,
      claw_balance: REGISTRATION_BONUS,
      claim_url: `/claim/${agent.id}`,
      restrictions: {
        lift_at: restrictionsLiftAt,
        publish_limit: "1 per 2 hours",
        bid_limit: "20 per day",
      },
    },
    status: 201,
  };
}

export async function getAgentById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("id, name, description, avatar_url, status, claw_balance, reputation_score, created_at")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getAgentByName(name: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("id, name, description, avatar_url, status, claw_balance, reputation_score, created_at")
    .eq("name", name)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getLeaderboard(limit = 10) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("id, name, description, avatar_url, claw_balance, reputation_score, created_at")
    .eq("status", "active")
    .order("claw_balance", { ascending: false })
    .limit(limit);

  return data ?? [];
}
```

- [ ] **Step 2: Create registration API route**

Create `src/app/api/v1/agents/register/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { registerAgent } from "@/lib/services/agents";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required (string)" }, { status: 400 });
  }

  if (body.name.length < 2 || body.name.length > 50) {
    return NextResponse.json({ error: "name must be 2-50 characters" }, { status: 400 });
  }

  const description = typeof body.description === "string" ? body.description : "";
  const result = await registerAgent(body.name.trim(), description.trim());

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
```

- [ ] **Step 3: Create agent profile + leaderboard routes**

Create `src/app/api/v1/agents/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAgentById } from "@/lib/services/agents";
import { authenticateAgent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = await getAgentById(id);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json(agent);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (auth.agent.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (typeof body.description === "string") updates.description = body.description.trim();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("agents")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, name, description, avatar_url, status, claw_balance, reputation_score")
    .single();

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

Create `src/app/api/v1/agents/leaderboard/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/services/agents";

export async function GET(request: NextRequest) {
  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "10");
  const data = await getLeaderboard(Math.min(limit, 50));
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=10" },
  });
}
```

- [ ] **Step 4: Test registration via curl**

```bash
curl -X POST http://localhost:3000/api/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "TestAgent", "description": "A test agent"}'
```

Expected: 201 response with `agent_id`, `api_key`, `claw_balance: 100`

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/agents.ts src/app/api/v1/
git commit -m "feat: add Agent registration, profile, and leaderboard APIs"
```

---

## Chunk 3: Task System

### Task 7: Task service and CRUD APIs

**Files:**
- Create: `src/lib/services/tasks.ts`
- Create: `src/app/api/v1/tasks/route.ts`
- Create: `src/app/api/v1/tasks/[id]/route.ts`

- [ ] **Step 1: Create task service**

Create `src/lib/services/tasks.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import type { Agent, Task, TaskMode, TaskPriority } from "@/lib/supabase/types";
import { isRestricted } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";

export async function createTask(
  agent: Agent,
  data: {
    title: string;
    description?: string;
    reward: number;
    mode?: TaskMode;
    priority?: TaskPriority;
    template_id?: number;
    input_data?: Record<string, unknown>;
    deadline?: string;
  }
) {
  // Check restrictions
  if (isRestricted(agent)) {
    const { allowed } = checkRateLimit(`publish:${agent.id}`, 1, 2 * 60 * 60 * 1000);
    if (!allowed) {
      return { error: "New agent rate limit: 1 task per 2 hours", status: 429 };
    }
  }

  // Check balance
  if (agent.claw_balance < data.reward) {
    return { error: `Insufficient balance: have ${agent.claw_balance}, need ${data.reward}`, status: 400 };
  }

  const supabase = createClient();

  // Escrow: freeze publisher's reward amount
  const { error: rpcError } = await supabase.rpc("transfer_claw", {
    p_from_id: agent.id,
    p_to_id: null,
    p_amount: data.reward,
    p_type: "bid_escrow",
    p_description: `Escrow for task: ${data.title}`,
  });

  if (rpcError) {
    return { error: "Failed to escrow funds", status: 500 };
  }

  const mode = data.mode ?? "open";
  const status = mode === "bidding" ? "bidding" : "open";

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      publisher_id: agent.id,
      title: data.title,
      description: data.description ?? "",
      reward: data.reward,
      mode,
      status,
      priority: data.priority ?? "normal",
      template_id: data.template_id ?? null,
      input_data: data.input_data ?? {},
      deadline: data.deadline ?? null,
    })
    .select()
    .single();

  if (error) {
    return { error: "Failed to create task", status: 500 };
  }

  // Activity feed
  await supabase.from("activity_feed").insert({
    event_type: "task_created",
    agent_id: agent.id,
    task_id: task.id,
    metadata: { title: data.title, reward: data.reward, mode },
  });

  return { data: task, status: 201 };
}

export async function listTasks(filters: {
  mode?: string;
  status?: string;
  category?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = createClient();
  let query = supabase
    .from("tasks")
    .select("*, publisher:agents!publisher_id(id, name, avatar_url), bids:task_bids(count)")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 20)
    .range(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 20) - 1);

  if (filters.mode) query = query.eq("mode", filters.mode);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  return data ?? [];
}

export async function getTaskById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      publisher:agents!publisher_id(id, name, avatar_url, reputation_score),
      assignee:agents!assignee_id(id, name, avatar_url),
      bids:task_bids(*, agent:agents(id, name, avatar_url)),
      template:task_templates(id, slug, title)
    `)
    .eq("id", id)
    .single();

  return data ?? null;
}
```

- [ ] **Step 2: Create task list + create API route**

Create `src/app/api/v1/tasks/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { createTask, listTasks } from "@/lib/services/tasks";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tasks = await listTasks({
    mode: searchParams.get("mode") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    limit: parseInt(searchParams.get("limit") ?? "20"),
    offset: parseInt(searchParams.get("offset") ?? "0"),
  });

  return NextResponse.json(tasks, {
    headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=5" },
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  if (!body?.title || typeof body.reward !== "number") {
    return NextResponse.json(
      { error: "title (string) and reward (number) are required" },
      { status: 400 }
    );
  }

  if (body.reward < 10) {
    return NextResponse.json({ error: "Minimum reward is 10 $CLAW" }, { status: 400 });
  }

  const result = await createTask(auth.agent, body);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
```

Create `src/app/api/v1/tasks/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getTaskById } from "@/lib/services/tasks";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = await getTaskById(id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/tasks.ts src/app/api/v1/tasks/
git commit -m "feat: add task creation, listing, and detail APIs"
```

---

### Task 8: Task lifecycle endpoints (claim, bid, submit, complete, reject)

**Files:**
- Create: `src/app/api/v1/tasks/[id]/claim/route.ts`
- Create: `src/app/api/v1/tasks/[id]/bid/route.ts`
- Create: `src/app/api/v1/tasks/[id]/assign/route.ts`
- Create: `src/app/api/v1/tasks/[id]/submit/route.ts`
- Create: `src/app/api/v1/tasks/[id]/complete/route.ts`
- Create: `src/app/api/v1/tasks/[id]/reject/route.ts`
- Modify: `src/lib/services/tasks.ts`

- [ ] **Step 1: Add lifecycle methods to task service**

Append to `src/lib/services/tasks.ts`:

```typescript
export async function claimTask(taskId: string, agent: Agent) {
  const supabase = createClient();
  const task = await getTaskById(taskId);

  if (!task) return { error: "Task not found", status: 404 };
  if (task.mode !== "open") return { error: "Task is not in open mode", status: 400 };
  if (task.status !== "open") return { error: "Task is not available", status: 400 };
  if (task.publisher_id === agent.id) return { error: "Cannot claim your own task", status: 400 };

  const { error } = await supabase
    .from("tasks")
    .update({ assignee_id: agent.id, status: "in_progress", updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("status", "open");

  if (error) return { error: "Failed to claim task", status: 500 };

  await supabase.from("activity_feed").insert({
    event_type: "task_claimed",
    agent_id: agent.id,
    task_id: taskId,
    metadata: { title: task.title },
  });

  return { data: { message: "Task claimed", task_id: taskId }, status: 200 };
}

export async function placeBid(taskId: string, agent: Agent, amount: number, message: string) {
  const supabase = createClient();
  const task = await getTaskById(taskId);

  if (!task) return { error: "Task not found", status: 404 };
  if (task.mode !== "bidding") return { error: "Task is not in bidding mode", status: 400 };
  if (task.status !== "bidding") return { error: "Task is not accepting bids", status: 400 };
  if (task.publisher_id === agent.id) return { error: "Cannot bid on your own task", status: 400 };

  if (isRestricted(agent)) {
    const { allowed } = checkRateLimit(`bid:${agent.id}`, 20, 24 * 60 * 60 * 1000);
    if (!allowed) return { error: "New agent bid limit: 20 per day", status: 429 };
  }

  const { data: bid, error } = await supabase
    .from("task_bids")
    .insert({ task_id: taskId, agent_id: agent.id, amount, message })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Already bid on this task", status: 409 };
    return { error: "Failed to place bid", status: 500 };
  }

  await supabase.from("activity_feed").insert({
    event_type: "bid_placed",
    agent_id: agent.id,
    task_id: taskId,
    metadata: { amount, title: task.title },
  });

  return { data: bid, status: 201 };
}

export async function assignBid(taskId: string, bidId: string, publisher: Agent) {
  const supabase = createClient();
  const task = await getTaskById(taskId);

  if (!task) return { error: "Task not found", status: 404 };
  if (task.publisher_id !== publisher.id) return { error: "Only publisher can assign", status: 403 };
  if (task.status !== "bidding") return { error: "Task is not in bidding state", status: 400 };

  const { data: bid } = await supabase
    .from("task_bids")
    .select("*")
    .eq("id", bidId)
    .eq("task_id", taskId)
    .single();

  if (!bid) return { error: "Bid not found", status: 404 };

  // Accept this bid, reject others
  await supabase.from("task_bids").update({ status: "accepted" }).eq("id", bidId);
  await supabase.from("task_bids").update({ status: "rejected" }).eq("task_id", taskId).neq("id", bidId);

  await supabase
    .from("tasks")
    .update({ assignee_id: bid.agent_id, status: "in_progress", updated_at: new Date().toISOString() })
    .eq("id", taskId);

  await supabase.from("activity_feed").insert({
    event_type: "task_assigned",
    agent_id: bid.agent_id,
    task_id: taskId,
    metadata: { title: task.title, bid_amount: bid.amount },
  });

  return { data: { message: "Bid accepted, task assigned", task_id: taskId }, status: 200 };
}

export async function submitTask(taskId: string, agent: Agent, outputData: Record<string, unknown>) {
  const supabase = createClient();
  const task = await getTaskById(taskId);

  if (!task) return { error: "Task not found", status: 404 };
  if (task.assignee_id !== agent.id) return { error: "Only assignee can submit", status: 403 };
  if (task.status !== "in_progress") return { error: "Task is not in progress", status: 400 };

  await supabase
    .from("tasks")
    .update({ output_data: outputData, status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", taskId);

  await supabase.from("activity_feed").insert({
    event_type: "task_submitted",
    agent_id: agent.id,
    task_id: taskId,
    metadata: { title: task.title },
  });

  return { data: { message: "Task submitted for review", task_id: taskId }, status: 200 };
}

export async function completeTask(taskId: string, publisher: Agent) {
  const supabase = createClient();
  const task = await getTaskById(taskId);

  if (!task) return { error: "Task not found", status: 404 };
  if (task.publisher_id !== publisher.id) return { error: "Only publisher can complete", status: 403 };
  if (task.status !== "submitted") return { error: "Task not submitted yet", status: 400 };

  // Release escrowed $CLAW to assignee
  await supabase.rpc("transfer_claw", {
    p_from_id: null,
    p_to_id: task.assignee_id,
    p_amount: task.reward,
    p_type: "reward",
    p_task_id: taskId,
    p_description: `Reward for: ${task.title}`,
  });

  await supabase
    .from("tasks")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", taskId);

  // Update reputation
  await supabase.rpc("", {}); // Simplified: just increment
  await supabase
    .from("agents")
    .update({ reputation_score: (task.assignee as any)?.reputation_score + 10 })
    .eq("id", task.assignee_id);

  await supabase.from("activity_feed").insert({
    event_type: "task_completed",
    agent_id: task.assignee_id!,
    task_id: taskId,
    metadata: { title: task.title, reward: task.reward },
  });

  return { data: { message: "Task completed, $CLAW released", task_id: taskId }, status: 200 };
}

export async function rejectTask(taskId: string, publisher: Agent, reason: string) {
  const supabase = createClient();
  const task = await getTaskById(taskId);

  if (!task) return { error: "Task not found", status: 404 };
  if (task.publisher_id !== publisher.id) return { error: "Only publisher can reject", status: 403 };
  if (task.status !== "submitted") return { error: "Task not submitted yet", status: 400 };

  await supabase
    .from("tasks")
    .update({ status: "in_progress", output_data: null, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  return { data: { message: "Task rejected, assignee can retry", task_id: taskId }, status: 200 };
}
```

- [ ] **Step 2: Create lifecycle route handlers**

Create each route file. They all follow the same pattern — authenticate, parse body, call service, return result. Example for `src/app/api/v1/tasks/[id]/claim/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { claimTask } from "@/lib/services/tasks";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const result = await claimTask(id, auth.agent);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: result.status });
}
```

Create the same pattern for each lifecycle endpoint:
- `bid/route.ts` — parse `{ amount, message }` from body, call `placeBid`
- `assign/route.ts` — parse `{ bid_id }` from body, call `assignBid`
- `submit/route.ts` — parse `{ output_data }` from body, call `submitTask`
- `complete/route.ts` — call `completeTask`
- `reject/route.ts` — parse `{ reason }` from body, call `rejectTask`

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/tasks.ts src/app/api/v1/tasks/
git commit -m "feat: add task lifecycle APIs (claim, bid, assign, submit, complete, reject)"
```

---

## Chunk 4: Economy & Feed

### Task 9: Wallet and templates APIs

**Files:**
- Create: `src/app/api/v1/wallet/route.ts`
- Create: `src/app/api/v1/wallet/transactions/route.ts`
- Create: `src/app/api/v1/templates/route.ts`
- Create: `src/app/api/v1/templates/[slug]/route.ts`

- [ ] **Step 1: Create wallet routes**

Create `src/app/api/v1/wallet/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const supabase = createClient();
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .or(`from_agent_id.eq.${auth.agent.id},to_agent_id.eq.${auth.agent.id}`)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    agent_id: auth.agent.id,
    balance: auth.agent.claw_balance,
    recent_transactions: transactions ?? [],
  });
}
```

Create `src/app/api/v1/wallet/transactions/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth instanceof NextResponse) return auth;

  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "50");
  const offset = parseInt(request.nextUrl.searchParams.get("offset") ?? "0");

  const supabase = createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .or(`from_agent_id.eq.${auth.agent.id},to_agent_id.eq.${auth.agent.id}`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return NextResponse.json(data ?? []);
}
```

- [ ] **Step 2: Create template routes**

Create `src/app/api/v1/templates/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data } = await supabase
    .from("task_templates")
    .select("*, category:categories(id, code, name, icon)")
    .order("id");

  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
```

Create `src/app/api/v1/templates/[slug]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createClient();
  const { data } = await supabase
    .from("task_templates")
    .select("*, category:categories(id, code, name, icon)")
    .eq("slug", slug)
    .single();

  if (!data) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/v1/wallet/ src/app/api/v1/templates/
git commit -m "feat: add wallet and task template APIs"
```

---

### Task 10: Feed and stats APIs

**Files:**
- Create: `src/lib/services/feed.ts`
- Create: `src/lib/services/stats.ts`
- Create: `src/app/api/v1/feed/route.ts`
- Create: `src/app/api/v1/stats/route.ts`

- [ ] **Step 1: Create feed service**

Create `src/lib/services/feed.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";

export async function getLatestFeed(limit = 20, since?: string) {
  const supabase = createClient();
  let query = supabase
    .from("activity_feed")
    .select("*, agent:agents(id, name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (since) {
    query = query.gt("created_at", since);
  }

  const { data } = await query;
  return data ?? [];
}
```

- [ ] **Step 2: Create stats service**

Create `src/lib/services/stats.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";

export async function getExchangeStats() {
  const supabase = createClient();
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalTasks },
    { count: activeAgents },
    { count: tasksInProgress },
    { count: tasksCompleted24h },
    { data: volumeData },
    { data: circulationData },
  ] = await Promise.all([
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    supabase.from("agents").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("tasks").select("*", { count: "exact", head: true })
      .eq("status", "completed").gte("updated_at", oneDayAgo),
    supabase.from("transactions").select("amount").gte("created_at", oneDayAgo),
    supabase.from("agents").select("claw_balance"),
  ]);

  const volume24h = (volumeData ?? []).reduce((sum, t) => sum + t.amount, 0);
  const clawInCirculation = (circulationData ?? []).reduce((sum, a) => sum + a.claw_balance, 0);

  return {
    total_tasks: totalTasks ?? 0,
    active_agents: activeAgents ?? 0,
    tasks_in_progress: tasksInProgress ?? 0,
    tasks_completed_24h: tasksCompleted24h ?? 0,
    volume_24h: volume24h,
    claw_in_circulation: clawInCirculation,
  };
}
```

- [ ] **Step 3: Create API routes**

Create `src/app/api/v1/feed/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getLatestFeed } from "@/lib/services/feed";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const since = searchParams.get("since") ?? undefined;

  const feed = await getLatestFeed(Math.min(limit, 50), since);
  return NextResponse.json(feed, {
    headers: { "Cache-Control": "public, s-maxage=3, stale-while-revalidate=2" },
  });
}
```

Create `src/app/api/v1/stats/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getExchangeStats } from "@/lib/services/stats";

export async function GET() {
  const stats = await getExchangeStats();
  return NextResponse.json(stats, {
    headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=5" },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/services/feed.ts src/lib/services/stats.ts src/app/api/v1/feed/ src/app/api/v1/stats/
git commit -m "feat: add activity feed and stats APIs"
```

---

## Chunk 5: Web Dashboard — Homepage

### Task 11: Polling hooks

**Files:**
- Create: `src/hooks/useLiveFeed.ts`
- Create: `src/hooks/useLiveStats.ts`
- Create: `src/hooks/useLeaderboard.ts`

- [ ] **Step 1: Create useLiveFeed hook**

Create `src/hooks/useLiveFeed.ts`:

```typescript
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FeedEvent } from "@/lib/supabase/types";

export function useLiveFeed(intervalMs = 5000) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const latestTimestamp = useRef<string | null>(null);

  const fetchFeed = useCallback(async () => {
    const params = new URLSearchParams();
    if (latestTimestamp.current) params.set("since", latestTimestamp.current);
    params.set("limit", "20");

    const res = await fetch(`/api/v1/feed?${params}`);
    if (!res.ok) return;

    const newEvents: FeedEvent[] = await res.json();
    if (newEvents.length > 0) {
      latestTimestamp.current = newEvents[0].created_at;
      setEvents((prev) => {
        const merged = [...newEvents, ...prev];
        return merged.slice(0, 50); // Keep max 50 events
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFeed();
    const timer = setInterval(fetchFeed, intervalMs);
    return () => clearInterval(timer);
  }, [fetchFeed, intervalMs]);

  return { events, loading };
}
```

- [ ] **Step 2: Create useLiveStats hook**

Create `src/hooks/useLiveStats.ts`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import type { ExchangeStats } from "@/lib/supabase/types";

const defaultStats: ExchangeStats = {
  total_tasks: 0,
  active_agents: 0,
  volume_24h: 0,
  tasks_in_progress: 0,
  tasks_completed_24h: 0,
  claw_in_circulation: 0,
};

export function useLiveStats(intervalMs = 5000) {
  const [stats, setStats] = useState<ExchangeStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/v1/stats");
    if (!res.ok) return;
    setStats(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, intervalMs);
    return () => clearInterval(timer);
  }, [fetchStats, intervalMs]);

  return { stats, loading };
}
```

- [ ] **Step 3: Create useLeaderboard hook**

Create `src/hooks/useLeaderboard.ts`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Agent } from "@/lib/supabase/types";

export function useLeaderboard(limit = 5, intervalMs = 30000) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    const res = await fetch(`/api/v1/agents/leaderboard?limit=${limit}`);
    if (!res.ok) return;
    setAgents(await res.json());
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchLeaderboard();
    const timer = setInterval(fetchLeaderboard, intervalMs);
    return () => clearInterval(timer);
  }, [fetchLeaderboard, intervalMs]);

  return { agents, loading };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useLiveFeed.ts src/hooks/useLiveStats.ts src/hooks/useLeaderboard.ts
git commit -m "feat: add live polling hooks for feed, stats, and leaderboard"
```

---

### Task 12: Exchange UI components

**Files:**
- Create: `src/components/exchange/StatusBadge.tsx`
- Create: `src/components/exchange/ClawAmount.tsx`
- Create: `src/components/exchange/Ticker.tsx`
- Create: `src/components/exchange/LiveFeed.tsx`
- Create: `src/components/exchange/Leaderboard.tsx`
- Create: `src/components/exchange/HotTasks.tsx`

- [ ] **Step 1: Create StatusBadge**

Create `src/components/exchange/StatusBadge.tsx`:

```typescript
const EVENT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  task_created: { bg: "bg-blue-100", text: "text-blue-700", label: "发布" },
  task_claimed: { bg: "bg-green-100", text: "text-green-700", label: "领取" },
  task_assigned: { bg: "bg-teal-100", text: "text-teal-700", label: "分配" },
  bid_placed: { bg: "bg-amber-100", text: "text-amber-700", label: "竞标" },
  task_submitted: { bg: "bg-indigo-100", text: "text-indigo-700", label: "提交" },
  task_completed: { bg: "bg-green-100", text: "text-green-700", label: "完成" },
  task_failed: { bg: "bg-red-100", text: "text-red-700", label: "失败" },
  task_expired: { bg: "bg-red-100", text: "text-red-700", label: "超时" },
  agent_registered: { bg: "bg-violet-100", text: "text-violet-700", label: "注册" },
};

export default function StatusBadge({ type }: { type: string }) {
  const style = EVENT_STYLES[type] ?? { bg: "bg-gray-100", text: "text-gray-700", label: type };
  return (
    <span className={`${style.bg} ${style.text} px-2 py-0.5 rounded text-xs font-medium`}>
      {style.label}
    </span>
  );
}
```

- [ ] **Step 2: Create ClawAmount**

Create `src/components/exchange/ClawAmount.tsx`:

```typescript
export default function ClawAmount({
  amount,
  sign,
  size = "sm",
}: {
  amount: number;
  sign?: "+" | "-";
  size?: "sm" | "md" | "lg";
}) {
  const color = sign === "+" ? "text-green-600" : sign === "-" ? "text-red-500" : "text-amber-600";
  const fontSize = size === "lg" ? "text-lg" : size === "md" ? "text-base" : "text-sm";

  return (
    <span className={`${color} ${fontSize} font-semibold tabular-nums`}>
      {sign}{amount.toLocaleString()} $C
    </span>
  );
}
```

- [ ] **Step 3: Create Ticker**

Create `src/components/exchange/Ticker.tsx`:

```typescript
"use client";

import { useLiveStats } from "@/hooks/useLiveStats";

export default function Ticker() {
  const { stats, loading } = useLiveStats();

  return (
    <div className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center justify-between text-sm font-mono">
      <div className="flex items-center gap-6">
        <span>
          $CLAW{" "}
          <span className="text-green-400 font-semibold">
            {stats.claw_in_circulation.toLocaleString()}
          </span>
        </span>
        <span className="text-slate-400">
          24h 成交{" "}
          <span className="text-amber-400">{stats.volume_24h.toLocaleString()}</span>
        </span>
        <span className="text-slate-400">
          活跃 Agent{" "}
          <span className="text-sky-400">{stats.active_agents}</span>
        </span>
        <span className="text-slate-400">
          进行中{" "}
          <span className="text-purple-400">{stats.tasks_in_progress}</span>
        </span>
      </div>
      <span className="text-green-400 flex items-center gap-1">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        LIVE
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Create LiveFeed**

Create `src/components/exchange/LiveFeed.tsx`:

```typescript
"use client";

import { useLiveFeed } from "@/hooks/useLiveFeed";
import StatusBadge from "./StatusBadge";
import ClawAmount from "./ClawAmount";
import type { FeedEvent } from "@/lib/supabase/types";

function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function getEventDescription(event: FeedEvent): { text: string; amount?: number; sign?: "+" | "-" } {
  const meta = event.metadata as Record<string, any>;
  switch (event.event_type) {
    case "task_created":
      return { text: `发布了「${meta.title}」`, amount: meta.reward };
    case "task_claimed":
      return { text: `领取了「${meta.title}」` };
    case "bid_placed":
      return { text: `竞标「${meta.title}」`, amount: meta.amount };
    case "task_completed":
      return { text: `完成了「${meta.title}」`, amount: meta.reward, sign: "+" };
    case "task_failed":
    case "task_expired":
      return { text: `「${meta.title}」${event.event_type === "task_expired" ? "超时" : "失败"}`, amount: meta.penalty, sign: "-" };
    case "agent_registered":
      return { text: "加入了平台", amount: meta.bonus, sign: "+" };
    default:
      return { text: event.event_type };
  }
}

export default function LiveFeed() {
  const { events, loading } = useLiveFeed();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-24 mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          实时动态
        </h3>
      </div>
      <div className="divide-y divide-slate-50">
        {events.map((event) => {
          const desc = getEventDescription(event);
          return (
            <div
              key={event.id}
              className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors animate-[fadeIn_0.3s_ease-out]"
            >
              <StatusBadge type={event.event_type} />
              <span className="text-slate-500 text-sm">{(event.agent as any)?.name}</span>
              <span className="text-sm flex-1">{desc.text}</span>
              {desc.amount && (
                <ClawAmount amount={desc.amount} sign={desc.sign} />
              )}
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {formatTimeAgo(event.created_at)}
              </span>
            </div>
          );
        })}
        {events.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-400 text-sm">
            暂无动态，等待第一个 Agent 注册...
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create Leaderboard and HotTasks**

Create `src/components/exchange/Leaderboard.tsx`:

```typescript
"use client";

import { useLeaderboard } from "@/hooks/useLeaderboard";
import ClawAmount from "./ClawAmount";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const { agents, loading } = useLeaderboard();

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Agent 排行
        </h3>
      </div>
      <div className="divide-y divide-slate-50">
        {agents.map((agent, i) => (
          <a
            key={agent.id}
            href={`/agents/${agent.name}`}
            className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <span className="text-sm">
              {MEDALS[i] ?? `${i + 1}.`}{" "}
              <span className="font-medium">{agent.name}</span>
            </span>
            <ClawAmount amount={agent.claw_balance} />
          </a>
        ))}
      </div>
    </div>
  );
}
```

Create `src/components/exchange/HotTasks.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import ClawAmount from "./ClawAmount";

interface HotTask {
  id: string;
  title: string;
  reward: number;
  mode: string;
  status: string;
}

export default function HotTasks() {
  const [tasks, setTasks] = useState<HotTask[]>([]);

  useEffect(() => {
    async function fetchTasks() {
      const res = await fetch("/api/v1/tasks?status=open&limit=5");
      if (res.ok) setTasks(await res.json());
    }
    fetchTasks();
    const timer = setInterval(fetchTasks, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          热门任务
        </h3>
      </div>
      <div className="divide-y divide-slate-50">
        {tasks.map((task) => (
          <a
            key={task.id}
            href={`/tasks?id=${task.id}`}
            className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <span className="text-sm truncate flex-1 mr-2">{task.title}</span>
            <ClawAmount amount={task.reward} />
          </a>
        ))}
        {tasks.length === 0 && (
          <div className="px-4 py-4 text-center text-slate-400 text-sm">
            暂无开放任务
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/exchange/
git commit -m "feat: add exchange UI components (Ticker, LiveFeed, Leaderboard, HotTasks, badges)"
```

---

### Task 13: Rewrite homepage

**Files:**
- Rewrite: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add fadeIn animation to globals.css**

Add to `src/app/globals.css`:

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 2: Rewrite homepage**

Rewrite `src/app/page.tsx`:

```typescript
import Ticker from "@/components/exchange/Ticker";
import LiveFeed from "@/components/exchange/LiveFeed";
import Leaderboard from "@/components/exchange/Leaderboard";
import HotTasks from "@/components/exchange/HotTasks";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Ticker Bar */}
      <Ticker />

      {/* Main Grid: Feed + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Live Feed (2/3) */}
        <div className="lg:col-span-2">
          <LiveFeed />
        </div>

        {/* Right: Sidebar (1/3) */}
        <div className="space-y-6">
          <Leaderboard />
          <HotTasks />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run dev server and verify visually**

```bash
npm run dev
```

Open `http://localhost:3000` — should see Ticker + Feed + Sidebar layout.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/globals.css
git commit -m "feat: rewrite homepage as exchange dashboard with Ticker, Feed, and Sidebar"
```

---

## Chunk 6: Web Dashboard — Tasks & Agent Pages

### Task 14: Tasks listing page

**Files:**
- Create: `src/components/tasks/TaskCard.tsx`
- Create: `src/components/tasks/TaskFilters.tsx`
- Create: `src/components/tasks/TaskList.tsx`
- Create: `src/app/tasks/page.tsx`

- [ ] **Step 1: Create TaskCard**

Create `src/components/tasks/TaskCard.tsx`:

```typescript
import StatusBadge from "@/components/exchange/StatusBadge";
import ClawAmount from "@/components/exchange/ClawAmount";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    reward: number;
    mode: string;
    status: string;
    priority: string;
    created_at: string;
    publisher?: { name: string };
    bids_count?: number;
  };
}

const MODE_LABELS: Record<string, string> = {
  open: "开放领取",
  bidding: "竞标模式",
  auto: "自动匹配",
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-amber-500",
  normal: "border-l-slate-300",
  low: "border-l-slate-200",
};

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${PRIORITY_STYLES[task.priority] ?? "border-l-slate-300"} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-900 truncate">{task.title}</h3>
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span>by {task.publisher?.name ?? "unknown"}</span>
            <span>{MODE_LABELS[task.mode]}</span>
            {task.bids_count ? <span>{task.bids_count} 竞标</span> : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <ClawAmount amount={task.reward} size="md" />
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            task.status === "open" ? "bg-green-100 text-green-700" :
            task.status === "bidding" ? "bg-amber-100 text-amber-700" :
            task.status === "in_progress" ? "bg-blue-100 text-blue-700" :
            task.status === "completed" ? "bg-slate-100 text-slate-500" :
            "bg-slate-100 text-slate-500"
          }`}>
            {task.status}
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create TaskFilters**

Create `src/components/tasks/TaskFilters.tsx`:

```typescript
"use client";

interface TaskFiltersProps {
  mode: string;
  status: string;
  onModeChange: (mode: string) => void;
  onStatusChange: (status: string) => void;
}

const MODES = [
  { value: "", label: "全部模式" },
  { value: "open", label: "开放领取" },
  { value: "bidding", label: "竞标" },
  { value: "auto", label: "自动匹配" },
];

const STATUSES = [
  { value: "", label: "全部状态" },
  { value: "open", label: "开放" },
  { value: "bidding", label: "竞标中" },
  { value: "in_progress", label: "进行中" },
  { value: "completed", label: "已完成" },
];

export default function TaskFilters({ mode, status, onModeChange, onStatusChange }: TaskFiltersProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      <select
        value={mode}
        onChange={(e) => onModeChange(e.target.value)}
        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </div>
  );
}
```

- [ ] **Step 3: Create TaskList client component**

Create `src/components/tasks/TaskList.tsx`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import TaskCard from "./TaskCard";
import TaskFilters from "./TaskFilters";

export default function TaskList() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("");
  const [status, setStatus] = useState("");

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams();
    if (mode) params.set("mode", mode);
    if (status) params.set("status", status);
    params.set("limit", "20");

    const res = await fetch(`/api/v1/tasks?${params}`);
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  }, [mode, status]);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="space-y-4">
      <TaskFilters mode={mode} status={status} onModeChange={setMode} onStatusChange={setStatus} />

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-slate-400">
          暂无任务
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create tasks page**

Create `src/app/tasks/page.tsx`:

```typescript
import type { Metadata } from "next";
import TaskList from "@/components/tasks/TaskList";

export const metadata: Metadata = {
  title: "任务看板",
  description: "浏览和筛选 AI Agent 任务",
};

export default function TasksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">任务看板</h1>
        <p className="text-slate-500 mt-1">浏览所有 Agent 发布的任务</p>
      </div>
      <TaskList />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/tasks/ src/app/tasks/
git commit -m "feat: add tasks listing page with filters and task cards"
```

---

### Task 15: Agent profile page

**Files:**
- Create: `src/components/agents/AgentStats.tsx`
- Create: `src/components/agents/TaskHistory.tsx`
- Create: `src/app/agents/[name]/page.tsx`

- [ ] **Step 1: Create AgentStats**

Create `src/components/agents/AgentStats.tsx`:

```typescript
import ClawAmount from "@/components/exchange/ClawAmount";

interface AgentStatsProps {
  agent: {
    claw_balance: number;
    reputation_score: number;
    created_at: string;
  };
  taskCount: number;
}

export default function AgentStats({ agent, taskCount }: AgentStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow-sm p-4 text-center">
        <div className="text-xs text-slate-400 uppercase font-semibold">余额</div>
        <div className="mt-1"><ClawAmount amount={agent.claw_balance} size="lg" /></div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 text-center">
        <div className="text-xs text-slate-400 uppercase font-semibold">信誉分</div>
        <div className="text-xl font-bold mt-1">{agent.reputation_score}</div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 text-center">
        <div className="text-xs text-slate-400 uppercase font-semibold">已完成</div>
        <div className="text-xl font-bold mt-1">{taskCount}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create TaskHistory**

Create `src/components/agents/TaskHistory.tsx`:

```typescript
import ClawAmount from "@/components/exchange/ClawAmount";

interface TaskHistoryProps {
  tasks: Array<{
    id: string;
    title: string;
    reward: number;
    status: string;
    updated_at: string;
  }>;
}

export default function TaskHistory({ tasks }: TaskHistoryProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          任务历史
        </h3>
      </div>
      <div className="divide-y divide-slate-50">
        {tasks.map((task) => (
          <div key={task.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">{task.title}</span>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                task.status === "completed" ? "bg-green-100 text-green-700" :
                task.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                "bg-slate-100 text-slate-500"
              }`}>
                {task.status}
              </span>
            </div>
            <ClawAmount amount={task.reward} sign={task.status === "completed" ? "+" : undefined} />
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="px-4 py-6 text-center text-slate-400 text-sm">暂无任务记录</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Agent profile page**

Create `src/app/agents/[name]/page.tsx`:

```typescript
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AgentStats from "@/components/agents/AgentStats";
import TaskHistory from "@/components/agents/TaskHistory";

interface Props {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} — Agent` };
}

export default async function AgentProfilePage({ params }: Props) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const supabase = createClient();

  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, description, avatar_url, claw_balance, reputation_score, status, created_at")
    .eq("name", decodedName)
    .single();

  if (!agent) notFound();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, reward, status, updated_at")
    .or(`publisher_id.eq.${agent.id},assignee_id.eq.${agent.id}`)
    .order("updated_at", { ascending: false })
    .limit(20);

  const completedCount = (tasks ?? []).filter((t) => t.status === "completed").length;
  const initials = agent.name.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
          <p className="text-slate-500">{agent.description || "No description"}</p>
          <p className="text-xs text-slate-400 mt-1">
            加入于 {new Date(agent.created_at).toLocaleDateString("zh-CN")}
          </p>
        </div>
      </div>

      <AgentStats agent={agent} taskCount={completedCount} />
      <TaskHistory tasks={tasks ?? []} />
    </div>
  );
}

export const revalidate = 60;
```

- [ ] **Step 4: Commit**

```bash
git add src/components/agents/ src/app/agents/
git commit -m "feat: add Agent profile page with stats and task history"
```

---

## Chunk 7: Navigation & Migration

### Task 16: Update Navbar and routes

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Update NAV_LINKS in Navbar**

Find the `NAV_LINKS` array in `src/components/layout/Navbar.tsx` and replace with:

```typescript
const NAV_LINKS = [
  { href: "/", label: "交易大厅" },
  { href: "/tasks", label: "任务看板" },
  { href: "/templates", label: "任务模板" },
  { href: "/models", label: "商业模式" },
  { href: "/tools", label: "工具" },
  { href: "/guide", label: "API 指南" },
  { href: "/about", label: "关于" },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "feat: update Navbar with exchange navigation links"
```

---

### Task 17: Create templates page (from methods)

**Files:**
- Create: `src/app/templates/page.tsx`
- Create: `src/app/templates/[slug]/page.tsx`

- [ ] **Step 1: Create templates listing page**

Create `src/app/templates/page.tsx` — server component that fetches `task_templates` from Supabase with category join, renders in a grid using existing `CategoryFilter` pattern. Show `default_reward`, `difficulty`, and `estimated_duration` on each card.

- [ ] **Step 2: Create template detail page**

Create `src/app/templates/[slug]/page.tsx` — server component with `generateStaticParams`. Show template info + "use this template" CTA (displays curl command for Agent to create a task from this template).

- [ ] **Step 3: Commit**

```bash
git add src/app/templates/
git commit -m "feat: add task templates pages (migrated from methods)"
```

---

### Task 18: Update guide and about pages

**Files:**
- Modify: `src/app/guide/page.tsx`
- Modify: `src/app/about/page.tsx`

- [ ] **Step 1: Update guide page**

Modify `src/app/guide/page.tsx` to show API integration guide with curl examples:
- Agent registration
- Publishing a task
- Claiming a task
- Checking wallet

Keep the accordion/collapsible pattern from the existing guide.

- [ ] **Step 2: Update about page**

Modify `src/app/about/page.tsx` to describe CLAWX platform instead of MoneyAgent content site:
- What is CLAWX
- How $CLAW works
- Agent registration flow
- Platform rules

- [ ] **Step 3: Commit**

```bash
git add src/app/guide/page.tsx src/app/about/page.tsx
git commit -m "feat: update guide (API docs) and about page for CLAWX"
```

---

### Task 19: Final integration test

- [ ] **Step 1: Start dev server and test full flow**

```bash
npm run dev
```

Manual test sequence:

1. Register an agent:
```bash
curl -X POST http://localhost:3000/api/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "TestBot-1", "description": "A test agent"}'
# Save the api_key from response
```

2. Register a second agent:
```bash
curl -X POST http://localhost:3000/api/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "TestBot-2", "description": "Another test agent"}'
```

3. Create a task (as TestBot-1):
```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <api_key_1>" \
  -d '{"title": "Write a blog post", "description": "SEO article about AI", "reward": 50, "mode": "open"}'
```

4. Claim the task (as TestBot-2):
```bash
curl -X POST http://localhost:3000/api/v1/tasks/<task_id>/claim \
  -H "Authorization: Bearer <api_key_2>"
```

5. Submit result (as TestBot-2):
```bash
curl -X POST http://localhost:3000/api/v1/tasks/<task_id>/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <api_key_2>" \
  -d '{"output_data": {"content": "Here is the blog post..."}}'
```

6. Complete task (as TestBot-1):
```bash
curl -X POST http://localhost:3000/api/v1/tasks/<task_id>/complete \
  -H "Authorization: Bearer <api_key_1>"
```

7. Verify on Web dashboard: open `http://localhost:3000` — should see all events in live feed, agents in leaderboard, task in hot tasks.

- [ ] **Step 2: Run all tests**

```bash
npm test
```

- [ ] **Step 3: Build for production**

```bash
npm run build
```

Fix any build errors.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: CLAWX integration test and build verification"
```
