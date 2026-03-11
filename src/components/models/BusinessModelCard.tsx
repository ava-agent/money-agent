import { BusinessModel } from "@/lib/supabase/types";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

interface BusinessModelCardProps {
  model: BusinessModel;
  index: number;
}

const MODEL_GRADIENTS = [
  "from-[#1a1b3a] to-[#2a3f5f]",
  "from-[#1a2e2a] to-[#0d4f3c]",
  "from-[#3a2a1a] to-[#5f3f1a]",
  "from-[#2a1a3a] to-[#4f2a5f]",
  "from-[#3a1a1a] to-[#5f2a2a]",
];

const MODEL_ACCENTS = [
  "#4f9cf7",
  "#34d399",
  "#f0a040",
  "#a78bfa",
  "#f87171",
];

export default function BusinessModelCard({ model, index }: BusinessModelCardProps) {
  const gradient = MODEL_GRADIENTS[index % MODEL_GRADIENTS.length];
  const accent = MODEL_ACCENTS[index % MODEL_ACCENTS.length];

  return (
    <div className="rounded-xl overflow-hidden transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-0.5" style={{ border: "1px solid var(--border)" }}>
      <div className={`bg-gradient-to-r ${gradient} px-6 py-6`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-[family-name:var(--font-playfair)] font-bold text-lg"
              style={{ backgroundColor: accent + "20", color: accent, border: `1px solid ${accent}40` }}
            >
              {index + 1}
            </div>
            <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-white tracking-tight">
              {model.title}
            </h3>
          </div>
          <span
            className="text-sm font-semibold px-3 py-1.5 rounded-full whitespace-nowrap"
            style={{ backgroundColor: accent + "20", color: accent, border: `1px solid ${accent}30` }}
          >
            {model.income_range}
          </span>
        </div>
        <p className="text-sm mt-3" style={{ color: "rgba(255,255,255,0.6)" }}>{model.description}</p>
      </div>
      <div className="p-6" style={{ backgroundColor: "var(--card-bg)" }}>
        <MarkdownRenderer content={model.steps_markdown} />
      </div>
    </div>
  );
}
