"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/lib/supabase/types";
import TaskFilters from "./TaskFilters";
import TaskCard from "./TaskCard";

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("");
  const [status, setStatus] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (mode) params.set("mode", mode);
      if (status) params.set("status", status);
      params.set("limit", "20");

      const res = await fetch(`/api/v1/tasks?${params.toString()}`);
      if (!res.ok) return;
      const data: Task[] = await res.json();
      setTasks(data);
    } catch {
      // silently ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, [mode, status]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div>
      <TaskFilters
        mode={mode}
        status={status}
        onModeChange={setMode}
        onStatusChange={setStatus}
      />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl animate-pulse"
              style={{ backgroundColor: "var(--surface)" }}
            />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-center py-12" style={{ color: "var(--muted)" }}>
          暂无任务
        </p>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
