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
        icon="📖"
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

      {/* 内容 - Collapsible Accordions */}
      <div className="space-y-4">
        {(sections ?? []).map((section, index) => (
          <details
            key={section.id}
            id={section.slug}
            className="group border border-gray-200 rounded-xl overflow-hidden"
            open={index === 0}
          >
            <summary className="flex items-center justify-between px-6 py-4 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors list-none">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>{SECTION_ICONS[section.section_type] || "📄"}</span>
                {section.title}
              </h2>
              <svg
                className="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 py-6 border-t border-gray-100">
              <MarkdownRenderer content={section.content_markdown} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
