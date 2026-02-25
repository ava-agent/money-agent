import { BusinessModel } from "@/lib/supabase/types";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

interface BusinessModelCardProps {
  model: BusinessModel;
  index: number;
}

export default function BusinessModelCard({ model, index }: BusinessModelCardProps) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            模式 {index + 1}：{model.title}
          </h3>
          <span className="bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full">
            {model.income_range}
          </span>
        </div>
        <p className="text-indigo-100 text-sm mt-2">{model.description}</p>
      </div>
      <div className="p-6">
        <MarkdownRenderer content={model.steps_markdown} />
      </div>
    </div>
  );
}
