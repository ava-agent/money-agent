import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import DifficultyDots from "@/components/shared/DifficultyDots";
import RiskBar from "@/components/shared/RiskBar";
import { getCategoryColors } from "@/lib/categoryColors";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServerClient();
  const { data: method } = await supabase.from("methods").select("title, description").eq("slug", slug).single();
  if (!method) return { title: "方法未找到" };
  return { title: method.title, description: method.description };
}

export async function generateStaticParams() {
  const supabase = createServerClient();
  const { data: methods } = await supabase.from("methods").select("slug");
  return (methods ?? []).map((m) => ({ slug: m.slug }));
}

export default async function MethodDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createServerClient();
  const { data: method } = await supabase.from("methods").select("*, categories(*)").eq("slug", slug).single();

  if (!method) notFound();

  const colors = getCategoryColors(method.categories?.code ?? "");

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link href="/methods" className="text-sm text-indigo-600 hover:text-indigo-800 mb-6 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7 7-7-7" />
        </svg>
        返回列表
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        <div>
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{method.icon}</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{method.title}</h1>
                <p className="text-gray-600 text-lg">{method.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-sm font-semibold ${colors.text} ${colors.bg} px-3 py-1 rounded-full`}>{method.income}</span>
              <DifficultyDots level={method.difficulty} />
              <RiskBar level={method.risk_level} />
              {method.categories && (
                <span className={`text-sm ${colors.text} flex items-center gap-1`}>
                  <span>{method.categories.icon}</span>
                  <span>{method.categories.name}</span>
                </span>
              )}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100">
            <MarkdownRenderer content={method.detail_markdown} />
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className={`rounded-xl border-2 ${colors.border} overflow-hidden`}>
            <div className={`${colors.bg} px-5 py-4`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{method.icon}</span>
                <span className={`text-sm font-semibold ${colors.text}`}>{method.categories?.icon} {method.categories?.name}</span>
              </div>
            </div>
            <div className="p-5 space-y-4 bg-white">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">预估收入</div>
                <div className={`text-lg font-bold ${colors.text}`}>{method.income}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">难度等级</div>
                <DifficultyDots level={method.difficulty} />
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">风险等级</div>
                <RiskBar level={method.risk_level} />
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">方法编号</div>
                <div className="text-sm font-mono text-gray-700">#{method.number}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
