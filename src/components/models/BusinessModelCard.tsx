import { BusinessModel } from "@/lib/supabase/types";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

interface BusinessModelCardProps {
  model: BusinessModel;
  index: number;
}

const MODEL_GRADIENTS = [
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-purple-500 to-pink-500",
  "from-rose-500 to-red-500",
];

export default function BusinessModelCard({ model, index }: BusinessModelCardProps) {
  const gradient = MODEL_GRADIENTS[index % MODEL_GRADIENTS.length];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
      <div className={`bg-gradient-to-r ${gradient} px-6 py-5`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm">
              {index + 1}
            </div>
            <h3 className="text-xl font-bold text-white">
              {model.title}
            </h3>
          </div>
          <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
            {model.income_range}
          </span>
        </div>
        <p className="text-white/90 text-sm mt-3">{model.description}</p>
      </div>
      <div className="p-6 bg-white">
        <MarkdownRenderer content={model.steps_markdown} />
      </div>
    </div>
  );
}
