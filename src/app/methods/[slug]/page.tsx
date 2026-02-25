import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import Badge from "@/components/shared/Badge";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

const DIFFICULTY_MAP: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  beginner: { label: "入门", variant: "success" },
  intermediate: { label: "中级", variant: "warning" },
  advanced: { label: "高级", variant: "danger" },
};

const RISK_MAP: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  low: { label: "低风险", variant: "success" },
  medium: { label: "中风险", variant: "warning" },
  high: { label: "高风险", variant: "danger" },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServerClient();
  const { data: method } = await supabase
    .from("methods")
    .select("title, description")
    .eq("slug", slug)
    .single();

  if (!method) return { title: "方法未找到" };

  return {
    title: method.title,
    description: method.description,
  };
}

export async function generateStaticParams() {
  const supabase = createServerClient();
  const { data: methods } = await supabase.from("methods").select("slug");
  return (methods ?? []).map((m) => ({ slug: m.slug }));
}

export default async function MethodDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createServerClient();

  const { data: method } = await supabase
    .from("methods")
    .select("*, categories(*)")
    .eq("slug", slug)
    .single();

  if (!method) notFound();

  const difficulty = DIFFICULTY_MAP[method.difficulty] || DIFFICULTY_MAP.beginner;
  const risk = RISK_MAP[method.risk_level] || RISK_MAP.low;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/methods"
        className="text-sm text-indigo-600 hover:text-indigo-800 mb-6 inline-block"
      >
        ← 返回方法列表
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{method.icon}</span>
          <div>
            <span className="text-sm text-gray-400 font-mono">#{method.number}</span>
            <h1 className="text-3xl font-bold text-gray-900">{method.title}</h1>
          </div>
        </div>
        <p className="text-gray-600 text-lg mb-4">{method.description}</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            💰 {method.income}
          </span>
          <Badge label={difficulty.label} variant={difficulty.variant} />
          <Badge label={risk.label} variant={risk.variant} />
          {method.categories && (
            <span className="text-sm text-gray-500">
              {method.categories.icon} {method.categories.name}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-8">
        <MarkdownRenderer content={method.detail_markdown} />
      </div>
    </div>
  );
}
