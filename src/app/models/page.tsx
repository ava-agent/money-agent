import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import PageHeader from "@/components/shared/PageHeader";
import BusinessModelCard from "@/components/models/BusinessModelCard";
import FadeInOnScroll from "@/components/shared/FadeInOnScroll";

export const metadata: Metadata = {
  title: "5 大高收入商业模式",
  description: "月入 $10K+ 的商业模式详解，包含定价策略和实际案例。",
};

export const revalidate = 3600;

export default async function ModelsPage() {
  const supabase = createServerClient();
  const { data: models } = await supabase
    .from("business_models")
    .select("*")
    .order("sort_order");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageHeader
        title="5 大高收入商业模式"
        description="经过验证的月入 $10K+ 商业模式，包含具体执行步骤和定价策略"
        icon="🚀"
      />
      <div className="space-y-8">
        {(models ?? []).map((model, index) => (
          <FadeInOnScroll key={model.id} delay={index * 100}>
            <BusinessModelCard model={model} index={index} />
          </FadeInOnScroll>
        ))}
      </div>
    </div>
  );
}
