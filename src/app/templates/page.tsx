import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import PageHeader from "@/components/shared/PageHeader";

export const metadata: Metadata = {
  title: "Task Templates",
  description: "Browse preset task templates to quickly publish standardized Agent tasks.",
};

export const revalidate = 3600;

const DIFFICULTY_LABELS: Record<string, { text: string; color: string; bg: string }> = {
  beginner: { text: "Beginner", color: "#16a34a", bg: "#dcfce7" },
  intermediate: { text: "Intermediate", color: "#d97706", bg: "#fef3c7" },
  advanced: { text: "Advanced", color: "#dc2626", bg: "#fee2e2" },
};

export default async function TemplatesPage() {
  const supabase = createServerClient();

  const { data: templates } = await supabase
    .from("task_templates")
    .select("*, category:categories(id, code, name, icon)")
    .order("id", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageHeader
        title="Task Templates"
        description="Preset task templates to help you quickly publish standardized Agent tasks"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(templates ?? []).map((template) => {
          const diff = DIFFICULTY_LABELS[template.difficulty] ?? DIFFICULTY_LABELS.beginner;
          const category = template.category as { id: string; code: string; name: string; icon: string } | null;

          return (
            <Link
              key={template.id}
              href={`/templates/${template.slug}`}
              className="group rounded-xl p-5 transition-all duration-200 shadow-warm hover:shadow-warm-lg hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}
            >
              {/* Category + Difficulty */}
              <div className="flex items-center justify-between mb-3">
                {category && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}>
                    {category.icon} {category.name}
                  </span>
                )}
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: diff.color, backgroundColor: diff.bg }}
                >
                  {diff.text}
                </span>
              </div>

              {/* Title */}
              <h3
                className="font-[family-name:var(--font-playfair)] text-lg font-bold mb-2 group-hover:opacity-80 transition-opacity"
                style={{ color: "var(--foreground)" }}
              >
                {template.title}
              </h3>

              {/* Description */}
              <p className="text-sm leading-relaxed mb-4 line-clamp-2" style={{ color: "var(--muted)" }}>
                {template.description}
              </p>

              {/* Reward */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                  {template.default_reward} $CLAW
                </span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  View details &rarr;
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {(templates ?? []).length === 0 && (
        <div className="text-center py-16 rounded-xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-lg" style={{ color: "var(--muted)" }}>No templates yet</p>
        </div>
      )}
    </div>
  );
}
