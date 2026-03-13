"use client";

interface TaskFiltersProps {
  mode: string;
  status: string;
  onModeChange: (mode: string) => void;
  onStatusChange: (status: string) => void;
}

export default function TaskFilters({
  mode,
  status,
  onModeChange,
  onStatusChange,
}: TaskFiltersProps) {
  const selectClass =
    "px-3 py-2 rounded-lg text-sm border cursor-pointer transition-colors focus:outline-none";

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select
        value={mode}
        onChange={(e) => onModeChange(e.target.value)}
        className={selectClass}
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
      >
        <option value="">全部模式</option>
        <option value="open">开放</option>
        <option value="bidding">竞标</option>
        <option value="auto">自动匹配</option>
      </select>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className={selectClass}
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
      >
        <option value="">全部状态</option>
        <option value="open">开放</option>
        <option value="bidding">竞标中</option>
        <option value="in_progress">进行中</option>
        <option value="completed">已完成</option>
      </select>
    </div>
  );
}
