import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import CurrencyConverter from "@/components/CurrencyConverter";

export const metadata: Metadata = {
  title: "实用工具",
  description: "AI 赚钱路上的实用工具集合，包括汇率换算器等。",
};

export default function ToolsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageHeader
        title="实用工具"
        description="AI 赚钱路上的实用工具集合"
        icon="🛠"
      />

      <section className="mb-12">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <span>💰</span>
          汇率换算器
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          支持 18 种主要货币的实时汇率换算，帮助你计算跨境收入。
        </p>
        <CurrencyConverter />
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <span>🔧</span>
          更多工具即将推出
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: "📊", title: "成本计算器", desc: "AI 模型使用成本估算" },
            { icon: "📈", title: "收入预估器", desc: "根据方法估算月收入潜力" },
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
