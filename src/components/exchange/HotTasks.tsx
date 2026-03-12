"use client";

import { useState, useEffect, useCallback } from "react";
import ClawAmount from "./ClawAmount";
import type { Task } from "@/lib/supabase/types";

const POLL_INTERVAL = 15_000;

export default function HotTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/tasks?status=open&limit=5");
      if (!res.ok) return;
      const data: Task[] = await res.json();
      setTasks(data);
    } catch {
      // silently ignore polling errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const id = setInterval(fetchTasks, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchTasks]);

  return (
    <div className="bg-white rounded-xl shadow-warm p-6">
      <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--foreground)" }}>
        热门任务
      </h2>

      {loading && tasks.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-center py-8 text-gray-400">暂无开放任务</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span
                className="text-sm truncate flex-1"
                style={{ color: "var(--foreground)" }}
              >
                {task.title}
              </span>
              <ClawAmount amount={task.reward} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
