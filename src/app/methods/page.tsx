import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import PageHeader from "@/components/shared/PageHeader";
import MethodGrid from "@/components/methods/MethodGrid";

export const metadata: Metadata = {
  title: "33 Ways to Make Money",
  description:
    "Practical AI money-making methods across 8 categories including job replacement, investment management, content production, and technical services.",
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
        title="33 AI Money-Making Methods"
        description="Practical methods across 8 categories, from beginner to advanced, find the right way for you to earn"
        icon="💰"
      />

      {/* Stats summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl p-4 text-center shadow-warm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div className="font-[family-name:var(--font-playfair)] text-2xl font-bold" style={{ color: "var(--accent)" }}>{methods?.length ?? 0}</div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Total Methods</div>
        </div>
        <div className="rounded-xl p-4 text-center shadow-warm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-emerald-600">
            {methods?.filter((m) => m.difficulty === "beginner").length ?? 0}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Beginner</div>
        </div>
        <div className="rounded-xl p-4 text-center shadow-warm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-amber-600">
            {methods?.filter((m) => m.difficulty === "intermediate").length ?? 0}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Intermediate</div>
        </div>
        <div className="rounded-xl p-4 text-center shadow-warm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-rose-600">
            {methods?.filter((m) => m.difficulty === "advanced").length ?? 0}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Advanced</div>
        </div>
      </div>

      <MethodGrid categories={categories ?? []} methods={methods ?? []} />
    </div>
  );
}
