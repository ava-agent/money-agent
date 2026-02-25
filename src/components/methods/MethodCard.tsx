import Link from "next/link";
import Badge from "@/components/shared/Badge";
import { Method } from "@/lib/supabase/types";

interface MethodCardProps {
  method: Method;
}

const DIFFICULTY_MAP: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  beginner: { label: "入门", variant: "success" },
  intermediate: { label: "中级", variant: "warning" },
  advanced: { label: "高级", variant: "danger" },
};

const RISK_MAP: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  low: { label: "低风险", variant: "success" },
  medium: { label: "中风险", variant: "warning" },
  high: { label: "高风险", variant: "danger" },
};

export default function MethodCard({ method }: MethodCardProps) {
  const difficulty = DIFFICULTY_MAP[method.difficulty] || DIFFICULTY_MAP.beginner;
  const risk = RISK_MAP[method.risk_level] || RISK_MAP.low;

  return (
    <Link href={`/methods/${method.slug}`}>
      <div className="group border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-indigo-300 transition-all h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{method.icon}</span>
          <span className="text-xs text-gray-400 font-mono">#{method.number}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors mb-2">
          {method.title}
        </h3>
        <p className="text-sm text-gray-500 mb-4 flex-1">{method.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-600">{method.income}</span>
          <div className="flex gap-1.5">
            <Badge label={difficulty.label} variant={difficulty.variant} />
            <Badge label={risk.label} variant={risk.variant} />
          </div>
        </div>
      </div>
    </Link>
  );
}
