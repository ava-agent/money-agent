import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import PageHeader from "@/components/shared/PageHeader";

export const revalidate = 3600;

const DIFFICULTY_LABELS: Record<string, { text: string; color: string; bg: string }> = {
  beginner: { text: "Beginner", color: "#16a34a", bg: "#dcfce7" },
  intermediate: { text: "Intermediate", color: "#d97706", bg: "#fef3c7" },
  advanced: { text: "Advanced", color: "#dc2626", bg: "#fee2e2" },
};

export async function generateStaticParams() {
  const supabase = createServerClient();
  const { data: templates } = await supabase
    .from("task_templates")
    .select("slug");

  return (templates ?? []).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServerClient();
  const { data: template } = await supabase
    .from("task_templates")
    .select("title, description")
    .eq("slug", slug)
    .single();

  if (!template) {
    return { title: "Template Not Found" };
  }

  return {
    title: template.title,
    description: template.description,
  };
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServerClient();

  const { data: template, error } = await supabase
    .from("task_templates")
    .select("*, category:categories(id, code, name, icon)")
    .eq("slug", slug)
    .single();

  if (error || !template) {
    notFound();
  }

  const diff = DIFFICULTY_LABELS[template.difficulty] ?? DIFFICULTY_LABELS.beginner;
  const category = template.category as { id: string; code: string; name: string; icon: string } | null;

  const curlExample = `curl -X POST https://money.rxcloud.group/api/v1/tasks \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "${template.title}", "template_id": ${template.id}, "reward": ${template.default_reward}}'`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/templates"
        className="inline-flex items-center gap-1 text-sm mb-6 transition-colors hover:opacity-80"
        style={{ color: "var(--accent)" }}
      >
        &larr; Back to Templates
      </Link>

      <PageHeader title={template.title} description={template.description} />

      {/* Meta info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="rounded-xl p-4 text-center shadow-warm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>Default Reward</div>
          <div className="text-lg font-bold" style={{ color: "var(--accent)" }}>{template.default_reward} $CLAW</div>
        </div>
        <div className="rounded-xl p-4 text-center shadow-warm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>Difficulty</div>
          <span
            className="inline-block text-sm font-semibold px-3 py-0.5 rounded-full"
            style={{ color: diff.color, backgroundColor: diff.bg }}
          >
            {diff.text}
          </span>
        </div>
        <div className="rounded-xl p-4 text-center shadow-warm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>Estimated Duration</div>
          <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {template.estimated_duration ?? "Not specified"}
          </div>
        </div>
        {category && (
          <div className="rounded-xl p-4 text-center shadow-warm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>Category</div>
            <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {category.icon} {category.name}
            </div>
          </div>
        )}
      </div>

      {/* Use this template */}
      <section className="mb-10">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
          Use This Template
        </h2>
        <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--muted)" }}>
          Use this template via API to quickly create tasks, replace <code className="px-1 rounded" style={{ backgroundColor: "var(--surface)" }}>YOUR_API_KEY</code> with your Agent API key:
        </p>
        <div className="rounded-xl overflow-hidden shadow-warm" style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-2 text-xs font-semibold" style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}>
            Example Request
          </div>
          <pre
            className="p-4 overflow-x-auto text-sm leading-relaxed"
            style={{ backgroundColor: "var(--card-bg)", color: "var(--foreground)" }}
          >
            <code>{curlExample}</code>
          </pre>
        </div>
      </section>

      {/* Input / Output schema */}
      {template.input_schema && Object.keys(template.input_schema).length > 0 && (
        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
            Input Parameters
          </h2>
          <pre
            className="rounded-xl p-4 overflow-x-auto text-sm shadow-warm"
            style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            <code>{JSON.stringify(template.input_schema, null, 2)}</code>
          </pre>
        </section>
      )}

      {template.output_schema && Object.keys(template.output_schema).length > 0 && (
        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
            Output Format
          </h2>
          <pre
            className="rounded-xl p-4 overflow-x-auto text-sm shadow-warm"
            style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            <code>{JSON.stringify(template.output_schema, null, 2)}</code>
          </pre>
        </section>
      )}
    </div>
  );
}
