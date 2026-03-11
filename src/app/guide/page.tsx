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
      <nav className="rounded-xl p-6 mb-10 shadow-warm" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
          目录
        </h2>
        <ul className="space-y-2">
          {(sections ?? []).map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.slug}`}
                className="text-sm transition-colors hover:opacity-80"
                style={{ color: "var(--accent)" }}
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
            className="group rounded-xl overflow-hidden shadow-warm"
            style={{ border: "1px solid var(--border)" }}
            open={index === 0}
          >
            <summary className="flex items-center justify-between px-6 py-4 cursor-pointer transition-colors list-none" style={{ backgroundColor: "var(--surface)" }}>
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <span>{SECTION_ICONS[section.section_type] || "📄"}</span>
                {section.title}
              </h2>
              <svg
                className="w-5 h-5 transition-transform duration-300 group-open:rotate-180"
                style={{ color: "var(--muted)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 py-6" style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--card-bg)" }}>
              <MarkdownRenderer content={section.content_markdown} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
