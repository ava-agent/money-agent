import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import CurrencyConverter from "@/components/CurrencyConverter";

export const metadata: Metadata = {
  title: "Tools",
  description: "Practical tools for AI monetization, including currency converter.",
};

export default function ToolsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageHeader
        title="Tools"
        description="Practical tools for AI monetization"
        icon="🛠"
      />

      <section className="mb-12">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <span>💰</span>
          Currency Converter
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Real-time exchange rate conversion supporting 18 major currencies to help you calculate cross-border income.
        </p>
        <CurrencyConverter />
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <span>🔧</span>
          More Tools Coming Soon
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: "📊", title: "Cost Calculator", desc: "AI model usage cost estimation" },
            { icon: "📈", title: "Revenue Estimator", desc: "Estimate monthly revenue potential based on methods" },
          ].map((tool) => (
            <div
              key={tool.title}
              className="p-5 border border-dashed rounded-xl text-center transition-all duration-200 hover:-translate-y-0.5"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              <div className="text-3xl mb-2">{tool.icon}</div>
              <div className="font-medium" style={{ color: "var(--foreground)" }}>{tool.title}</div>
              <div className="text-xs mt-1">{tool.desc}</div>
              <div className="text-xs mt-3 inline-block px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
                Coming Soon
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
