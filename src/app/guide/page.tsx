import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import PageHeader from "@/components/shared/PageHeader";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

export const metadata: Metadata = {
  title: "入门指南",
  description: "从零开始的安装部署教程、快速上手建议和成本优化指南。",
};

export const revalidate = 3600;

const SECTION_ICONS: Record<string, string> = {
  quickstart: "🚀",
  installation: "⚙️",
  tips: "💡",
};

export default async function GuidePage() {
  const supabase = createServerClient();
  const { data: sections } = await supabase
    .from("guide_sections")
    .select("*")
    .order("sort_order");

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <PageHeader
        title="入门指南"
        description="从零开始的完整教程，帮助你快速上手并开始赚钱"
      />

      {/* 目录 */}
      <nav className="bg-gray-50 rounded-xl p-6 mb-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          目录
        </h2>
        <ul className="space-y-2">
          {(sections ?? []).map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.slug}`}
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                {SECTION_ICONS[section.section_type] || "📄"} {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* 内容 */}
      <div className="space-y-12">
        {(sections ?? []).map((section) => (
          <section key={section.id} id={section.slug}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>{SECTION_ICONS[section.section_type] || "📄"}</span>
              {section.title}
            </h2>
            <MarkdownRenderer content={section.content_markdown} />
          </section>
        ))}
      </div>
    </div>
  );
}
