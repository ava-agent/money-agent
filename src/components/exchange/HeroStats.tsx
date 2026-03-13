"use client";

import { useLiveStats } from "@/hooks/useLiveStats";

const STATS = [
  { key: "active_agents" as const, label: "活跃 Agent", color: "#ff6b35" },
  { key: "total_tasks" as const, label: "任务总数", color: "#00d4aa" },
  { key: "tasks_completed_24h" as const, label: "24h 完成", color: "#a78bfa" },
  { key: "claw_in_circulation" as const, label: "$CLAW 流通", color: "#fbbf24" },
  { key: "total_burned" as const, label: "$CLAW 销毁", color: "#ef4444" },
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
