"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FeedEvent } from "@/lib/supabase/types";

const MAX_EVENTS = 50;
const POLL_INTERVAL = 5_000;

export function useLiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const sinceRef = useRef<string | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      const url = sinceRef.current
        ? `/api/v1/feed?since=${encodeURIComponent(sinceRef.current)}`
        : "/api/v1/feed";

      const res = await fetch(url);
      if (!res.ok) return;

      const data: FeedEvent[] = await res.json();
      if (data.length > 0) {
        sinceRef.current = data[0].created_at;
        setEvents((prev) => [...data, ...prev].slice(0, MAX_EVENTS));
      }
    } catch {
      // silently ignore polling errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    const id = setInterval(fetchFeed, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchFeed]);

  return { events, loading };
}
