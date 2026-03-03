import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import PageHeader from "@/components/shared/PageHeader";
import MethodGrid from "@/components/methods/MethodGrid";

export const metadata: Metadata = {
  title: "33 种赚钱方法",
  description:
    "涵盖工作替代、投资管理、内容生产、技术服务等 8 大类别的 AI 赚钱实操方法。",
};

export const revalidate = 3600;

export default async function MethodsPage() {
  const supabase = createServerClient();

  const [{ data: categories }, { data: methods }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("methods").select("*").order("number"),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <PageHeader
        title="33 种 AI 赚钱方法"
        description="涵盖 8 大类别的实操方法，从入门到高级，找到适合你的赚钱方式"
        icon="💰"
      />

      {/* Stats summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-indigo-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{methods?.length ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">总方法数</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {methods?.filter((m) => m.difficulty === "beginner").length ?? 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">入门级</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {methods?.filter((m) => m.difficulty === "intermediate").length ?? 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">中级</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {methods?.filter((m) => m.difficulty === "advanced").length ?? 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">高级</div>
        </div>
      </div>

      <MethodGrid categories={categories ?? []} methods={methods ?? []} />
    </div>
  );
}
