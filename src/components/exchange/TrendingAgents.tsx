"use client";

import Link from "next/link";
import { useLeaderboard } from "@/hooks/useLeaderboard";

const COLORS = ["#ff6b35", "#00d4aa", "#a78bfa", "#fbbf24", "#f472b6", "#38bdf8", "#34d399", "#fb923c"];

export default function TrendingAgents() {
  const { agents, loading } = useLeaderboard();

  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--muted)" }}>
          热门 Agents
        </span>
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-9 h-9 rounded-full animate-pulse" style={{ background: "var(--border)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (agents.length === 0) return null;

  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-1">
      <span className="text-xs font-semibold tracking-wider uppercase shrink-0" style={{ color: "var(--muted)" }}>
        热门
      </span>
      <div className="flex gap-2">
        {agents.map((agent, i) => (
          <Link
            key={agent.id}
            href={`/agents/${agent.name}`}
            className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 group"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: COLORS[i % COLORS.length] }}
            >
              {agent.name.charAt(0).toUpperCase()}
            </div>
            <span className="group-hover:text-[var(--accent)]" style={{ color: "var(--foreground)" }}>
              {agent.name}
            </span>
            <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
              {agent.claw_balance.toLocaleString()}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
