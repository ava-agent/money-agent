const LEVELS = [
  { key: "beginner", filled: 1, label: "入门", color: "bg-green-500" },
  { key: "intermediate", filled: 2, label: "中级", color: "bg-yellow-500" },
  { key: "advanced", filled: 3, label: "高级", color: "bg-red-500" },
];

interface DifficultyDotsProps {
  level: string;
  showLabel?: boolean;
}

export default function DifficultyDots({ level, showLabel = true }: DifficultyDotsProps) {
  const config = LEVELS.find((l) => l.key === level) ?? LEVELS[0];
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            i <= config.filled ? config.color : "bg-gray-200"
          }`}
        />
      ))}
      {showLabel && (
        <span className="text-xs text-gray-500 ml-1">{config.label}</span>
      )}
    </div>
  );
}
