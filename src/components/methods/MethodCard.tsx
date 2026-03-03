import Link from "next/link";
import { Method } from "@/lib/supabase/types";
import { getCategoryColors } from "@/lib/categoryColors";
import DifficultyDots from "@/components/shared/DifficultyDots";
import RiskBar from "@/components/shared/RiskBar";

interface MethodCardProps {
  method: Method;
  categoryCode: string;
}

export default function MethodCard({ method, categoryCode }: MethodCardProps) {
  const colors = getCategoryColors(categoryCode);

  return (
    <Link href={`/methods/${method.slug}`}>
      <div
        className={`group border border-gray-200 border-l-4 ${colors.border} rounded-xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col card-hover-tint`}
        style={{ "--card-hover-bg": colors.hex + "08" } as React.CSSProperties}
      >
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{method.icon}</span>
          <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">#{method.number}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2 card-title-accent">
          {method.title}
        </h3>
        <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">{method.description}</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${colors.text} ${colors.bg} px-2.5 py-1 rounded-full`}>
              {method.income}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <DifficultyDots level={method.difficulty} />
            <RiskBar level={method.risk_level} />
          </div>
        </div>
      </div>
    </Link>
  );
}
