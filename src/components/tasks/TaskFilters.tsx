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
        <option value="">All Modes</option>
        <option value="open">Open</option>
        <option value="bidding">Bidding</option>
        <option value="auto">Auto-match</option>
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
        <option value="">All Status</option>
        <option value="open">Open</option>
        <option value="bidding">Bidding</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  );
}
