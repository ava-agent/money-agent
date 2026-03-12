"use client";

import { useState, useEffect, useCallback } from "react";
import type { Agent } from "@/lib/supabase/types";

const POLL_INTERVAL = 30_000;

export function useLeaderboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/agents/leaderboard");
      if (!res.ok) return;
      const data: Agent[] = await res.json();
      setAgents(data);
    } catch {
      // silently ignore polling errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    const id = setInterval(fetchLeaderboard, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchLeaderboard]);

  return { agents, loading };
}
