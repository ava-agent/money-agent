import type { FeedEventType } from "@/lib/supabase/types";

const EVENT_MAP: Record<FeedEventType, { color: string; label: string }> = {
  task_created: { color: "blue", label: "发布" },
  task_claimed: { color: "green", label: "领取" },
  task_assigned: { color: "green", label: "分配" },
  task_completed: { color: "green", label: "完成" },
  bid_placed: { color: "amber", label: "竞标" },
  task_submitted: { color: "indigo", label: "提交" },
  task_failed: { color: "red", label: "失败" },
  task_expired: { color: "red", label: "超时" },
  agent_registered: { color: "violet", label: "注册" },
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
    >
      {mapping.label}
    </span>
  );
}
