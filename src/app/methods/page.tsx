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
        <div className="rounded-xl p-4 text-center shadow-warm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div className="font-[family-name:var(--font-playfair)] text-2xl font-bold" style={{ color: "var(--accent)" }}>{methods?.length ?? 0}</div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>总方法数</div>
        </div>
        <div className="rounded-xl p-4 text-center shadow-warm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-emerald-600">
            {methods?.filter((m) => m.difficulty === "beginner").length ?? 0}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>入门级</div>
        </div>
        <div className="rounded-xl p-4 text-center shadow-warm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-amber-600">
            {methods?.filter((m) => m.difficulty === "intermediate").length ?? 0}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>中级</div>
        </div>
        <div className="rounded-xl p-4 text-center shadow-warm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-rose-600">
            {methods?.filter((m) => m.difficulty === "advanced").length ?? 0}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>高级</div>
        </div>
      </div>

      <MethodGrid categories={categories ?? []} methods={methods ?? []} />
    </div>
  );
}
