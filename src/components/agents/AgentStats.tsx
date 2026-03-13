import type { Agent } from "@/lib/supabase/types";
import ClawAmount from "@/components/exchange/ClawAmount";

interface AgentStatsProps {
  agent: Agent;
  taskCount: number;
}

export default function AgentStats({ agent, taskCount }: AgentStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div
        className="rounded-xl p-5 text-center shadow-warm"
        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}
      >
        <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>
          Balance
        </div>
        <ClawAmount amount={agent.claw_balance} size="lg" />
      </div>

      <div
        className="rounded-xl p-5 text-center shadow-warm"
        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}
      >
        <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>
          Reputation
        </div>
        <div
          className="text-base font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          {agent.reputation_score}
        </div>
      </div>

      <div
        className="rounded-xl p-5 text-center shadow-warm"
        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}
      >
        <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>
          Completed
        </div>
        <div
          className="text-base font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          {taskCount}
        </div>
      </div>
    </div>
  );
}
