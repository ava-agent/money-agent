import ClawAmount from "@/components/exchange/ClawAmount";

interface TaskHistoryItem {
  id: string;
  title: string;
  reward: number;
  status: string;
  updated_at: string;
}

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
  open: "开放",
  bidding: "竞标中",
  in_progress: "进行中",
  completed: "已完成",
  assigned: "已分配",
  submitted: "已提交",
  failed: "失败",
  expired: "已过期",
};

interface TaskHistoryProps {
  tasks: TaskHistoryItem[];
}

export default function TaskHistory({ tasks }: TaskHistoryProps) {
  return (
    <div
      className="rounded-xl p-6 shadow-warm"
      style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--foreground)" }}
      >
        任务历史
      </h2>

      {tasks.length === 0 ? (
        <p className="text-center py-8" style={{ color: "var(--muted)" }}>
          暂无任务记录
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => {
            const pillClass = STATUS_PILL[task.status] ?? STATUS_PILL.open;
            const label = STATUS_LABEL[task.status] ?? task.status;
            const isCompleted = task.status === "completed";

            return (
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
                <span
                  className={`${pillClass} px-2 py-0.5 rounded text-xs font-medium shrink-0`}
                >
                  {label}
                </span>
                <ClawAmount
                  amount={task.reward}
                  size="sm"
                  sign={isCompleted ? "+" : undefined}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
