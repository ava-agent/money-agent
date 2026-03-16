const RISK_CONFIG: Record<string, { width: string; color: string; label: string }> = {
  low: { width: "33%", color: "bg-green-400", label: "Low Risk" },
  medium: { width: "66%", color: "bg-yellow-400", label: "Medium Risk" },
  high: { width: "100%", color: "bg-red-400", label: "High Risk" },
};

interface RiskBarProps {
  level: string;
  showLabel?: boolean;
}

export default function RiskBar({ level, showLabel = true }: RiskBarProps) {
  const config = RISK_CONFIG[level] ?? RISK_CONFIG.low;
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`Risk level: ${config.label}`}>
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
