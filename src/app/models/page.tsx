import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import PageHeader from "@/components/shared/PageHeader";
import BusinessModelCard from "@/components/models/BusinessModelCard";
import FadeInOnScroll from "@/components/shared/FadeInOnScroll";

export const metadata: Metadata = {
  title: "5 High-Income Business Models",
  description: "Detailed breakdown of business models earning $10K+/month, including pricing strategies and real case studies.",
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
        title="5 High-Income Business Models"
        description="Proven business models earning $10K+/month, with specific execution steps and pricing strategies"
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
