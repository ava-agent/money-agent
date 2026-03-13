const RISK_CONFIG: Record<string, { width: string; color: string; label: string }> = {
  low: { width: "33%", color: "bg-green-400", label: "低风险" },
  medium: { width: "66%", color: "bg-yellow-400", label: "中风险" },
  high: { width: "100%", color: "bg-red-400", label: "高风险" },
};

interface RiskBarProps {
  level: string;
  showLabel?: boolean;
}

export default function RiskBar({ level, showLabel = true }: RiskBarProps) {
  const config = RISK_CONFIG[level] ?? RISK_CONFIG.low;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${config.color} transition-all duration-500`}
          style={{ width: config.width }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500">{config.label}</span>
      )}
    </div>
  );
}
