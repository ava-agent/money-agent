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
        className={`group border border-l-4 ${colors.border} rounded-xl p-5 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col card-hover-tint shadow-warm hover:shadow-warm-lg`}
        style={{ "--card-hover-bg": colors.hex + "08", borderColor: "var(--border)", backgroundColor: "var(--card-bg)" } as React.CSSProperties}
      >
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{method.icon}</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: "var(--muted)", backgroundColor: "var(--surface)" }}>#{method.number}</span>
        </div>
        <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold mb-2 card-title-accent" style={{ color: "var(--foreground)" }}>
          {method.title}
        </h3>
        <p className="text-sm mb-4 flex-1 line-clamp-2" style={{ color: "var(--muted)" }}>{method.description}</p>
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
