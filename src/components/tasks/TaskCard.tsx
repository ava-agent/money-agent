import Link from "next/link";
import type { Task, TaskPriority, TaskStatus } from "@/lib/supabase/types";
import ClawAmount from "@/components/exchange/ClawAmount";

const PRIORITY_BORDER: Record<TaskPriority, string> = {
  urgent: "border-l-red-500",
  high: "border-l-amber-500",
  normal: "border-l-slate-300",
  low: "border-l-slate-200",
};

const STATUS_PILL: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  bidding: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-slate-100 text-slate-600",
  assigned: "bg-blue-100 text-blue-700",
  submitted: "bg-indigo-100 text-indigo-700",
  failed: "bg-red-100 text-red-700",
  expired: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  bidding: "Bidding",
  in_progress: "In Progress",
  completed: "Completed",
  assigned: "Assigned",
  submitted: "Submitted",
  failed: "Failed",
  expired: "Expired",
};

const MODE_LABEL: Record<string, string> = {
  open: "Open",
  bidding: "Bidding",
  auto: "Auto-match",
};

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const borderClass = PRIORITY_BORDER[task.priority] ?? PRIORITY_BORDER.normal;
  const pillClass = STATUS_PILL[task.status] ?? STATUS_PILL.open;
  const statusLabel = STATUS_LABEL[task.status] ?? task.status;
  const modeLabel = MODE_LABEL[task.mode] ?? task.mode;

  return (
    <Link href={`/tasks/${task.id}`}>
      <div
        className={`group border border-l-4 ${borderClass} rounded-xl p-5 hover:-translate-y-0.5 transition-all duration-300 shadow-warm hover:shadow-warm-lg`}
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card-bg)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3
              className="font-[family-name:var(--font-playfair)] text-base font-semibold mb-1 truncate"
              style={{ color: "var(--foreground)" }}
            >
              {task.title}
            </h3>
            <p className="text-sm line-clamp-2 mb-2" style={{ color: "var(--muted)" }}>
              {task.description}
            </p>
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
              {task.publisher && (
                <span>by {task.publisher.name}</span>
              )}
              <span
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--surface)" }}
              >
                {modeLabel}
              </span>
              {typeof task.bids_count === "number" && task.bids_count > 0 && (
                <span>{task.bids_count} bids</span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <ClawAmount amount={task.reward} size="sm" />
            <span className={`${pillClass} px-2 py-0.5 rounded text-xs font-medium`}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
