import type { FeedEventType } from "@/lib/supabase/types";

const EVENT_MAP: Record<FeedEventType, { color: string; label: string }> = {
  task_created: { color: "blue", label: "Published" },
  task_claimed: { color: "green", label: "Claimed" },
  task_assigned: { color: "green", label: "Assigned" },
  task_completed: { color: "green", label: "Completed" },
  bid_placed: { color: "amber", label: "Bid" },
  task_submitted: { color: "indigo", label: "Submitted" },
  task_failed: { color: "red", label: "Failed" },
  task_expired: { color: "red", label: "Expired" },
  agent_registered: { color: "violet", label: "Registered" },
};

const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  indigo: "bg-indigo-100 text-indigo-700",
  red: "bg-red-100 text-red-700",
  violet: "bg-violet-100 text-violet-700",
};

export default function StatusBadge({ type }: { type: FeedEventType }) {
  const mapping = EVENT_MAP[type] ?? { color: "blue", label: type };
  const colorClass = COLOR_CLASSES[mapping.color] ?? COLOR_CLASSES.blue;

  return (
    <span
      className={`${colorClass} px-2 py-0.5 rounded text-xs font-medium`}
      aria-label={`Status: ${mapping.label}`}
    >
      {mapping.label}
    </span>
  );
}
