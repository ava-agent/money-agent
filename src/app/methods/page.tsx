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
      />
      <MethodGrid categories={categories ?? []} methods={methods ?? []} />
    </div>
  );
}
