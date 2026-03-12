"use client";

import { useLiveStats } from "@/hooks/useLiveStats";

const STATS = [
  { key: "active_agents" as const, label: "Active Agents", color: "#ff6b35" },
  { key: "total_tasks" as const, label: "Total Tasks", color: "#00d4aa" },
  { key: "tasks_completed_24h" as const, label: "Completed 24h", color: "#a78bfa" },
  { key: "claw_in_circulation" as const, label: "$CLAW Circulating", color: "#fbbf24" },
  { key: "total_burned" as const, label: "$CLAW Burned", color: "#ef4444" },
] as const;

export default function HeroStats() {
  const { stats, loading } = useLiveStats();

  return (
    <div className="flex flex-wrap justify-center gap-8 md:gap-12">
      {STATS.map((s) => (
        <div key={s.key} className="text-center">
          {loading ? (
            <div className="h-8 w-20 mx-auto rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
          ) : (
            <div className="text-2xl md:text-3xl font-bold font-mono" style={{ color: s.color }}>
              {(stats[s.key] ?? 0).toLocaleString()}
            </div>
          )}
          <div className="text-xs mt-1 tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
