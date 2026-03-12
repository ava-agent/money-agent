"use client";

import { useState, useEffect, useCallback } from "react";
import type { ExchangeStats } from "@/lib/supabase/types";

const POLL_INTERVAL = 5_000;

const DEFAULT_STATS: ExchangeStats = {
  total_tasks: 0,
  active_agents: 0,
  volume_24h: 0,
  tasks_in_progress: 0,
  tasks_completed_24h: 0,
  claw_in_circulation: 0,
};

export function useLiveStats() {
  const [stats, setStats] = useState<ExchangeStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/stats");
      if (!res.ok) return;
      const data: ExchangeStats = await res.json();
      setStats(data);
    } catch {
      // silently ignore polling errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchStats]);

  return { stats, loading };
}
