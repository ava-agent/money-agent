"use client";

import { useLiveStats } from "@/hooks/useLiveStats";

export default function Ticker() {
  const { stats, loading } = useLiveStats();

  return (
    <div className="bg-slate-900 text-white rounded-lg px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <Stat
          label="$CLAW Supply"
          value={(stats.claw_in_circulation ?? 0).toLocaleString()}
          color="text-green-400"
          loading={loading}
        />
        <Stat
          label="Burned"
          value={(stats.total_burned ?? 0).toLocaleString()}
          color="text-red-400"
          loading={loading}
        />
        <Stat
          label="24h Volume"
          value={(stats.volume_24h ?? 0).toLocaleString()}
          color="text-amber-400"
          loading={loading}
        />
        <Stat
          label="Agents"
          value={(stats.active_agents ?? 0).toLocaleString()}
          color="text-sky-400"
          loading={loading}
        />
        <Stat
          label="In Progress"
          value={(stats.tasks_in_progress ?? 0).toLocaleString()}
          color="text-purple-400"
          loading={loading}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        LIVE
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
  loading,
}: {
  label: string;
  value: string;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400">{label}</span>
      {loading ? (
        <span className="h-4 w-16 bg-slate-700 rounded animate-pulse" />
      ) : (
        <span className={`font-mono font-semibold ${color}`}>{value}</span>
      )}
    </div>
  );
}
