import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";

export const metadata: Metadata = {
  title: "关于",
  description: "关于 MoneyAgent 项目、重要风险提示和竞品对比分析。",
};

const FEATURES = ["开源", "本地部署", "AI深度集成", "无代码", "自主执行", "免费"];

const COMPETITORS = [
  { name: "Manus AI", type: "闭源云平台", features: [false, false, true, true, true, false] },
  { name: "AutoGPT", type: "开源自主代理", features: [true, true, true, false, true, true] },
  { name: "n8n", type: "可视化工作流", features: [true, true, false, true, false, true] },
  { name: "LangChain", type: "开发框架", features: [true, true, true, false, false, true] },
  { name: "OpenClaw", type: "开源自动化平台", features: [true, true, true, false, true, true], highlight: true },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <PageHeader title="关于 MoneyAgent" description="了解项目背景、风险提示和竞品对比" icon="ℹ️" />

      <section className="mb-12">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>项目简介</h2>
        <div className="prose max-w-none" style={{ color: "var(--muted)" }}>
          <p>
            MoneyAgent 是一个基于 AI 技术的赚钱方法指南网站，整理了 <strong style={{ color: "var(--foreground)" }}>33 种</strong> 经过验证的 AI 赚钱方法和 <strong style={{ color: "var(--foreground)" }}>5 大高收入商业模式</strong>。
          </p>
          <p>
            内容来源于 OpenClaw 社区整理的实操经验，涵盖工作替代、投资管理、内容生产、技术服务等 <strong style={{ color: "var(--foreground)" }}>8 大类别</strong>。我们的目标是帮助你找到最适合自己的 AI 变现路径。
          </p>
        </div>
      </section>

      <div className="section-divider" />

      <section className="mb-12">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <span>⚠️</span> 重要风险提示
        </h2>
        <div className="rounded-xl p-6 space-y-3" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
          {["AI 工具会犯错：永远在执行前审查 AI 的输出，尤其涉及金融操作", "加密货币极高风险：永远不要投入超过你能承受损失的金额", "遵守当地法律：不同国家/地区对 AI 使用和金融活动有不同规定", "没有保证的收入：所有收入数字都是估算范围，实际结果因人而异", "API 成本累积快：未优化的自动化可能在你意识到之前烧完大量费用", "安全第一：涉及金融 API 的密钥要妥善保管，启用 2FA"].map((warning) => (
            <div key={warning} className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
              <p className="text-sm text-red-700">{warning}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      <section className="mb-12">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <span>🛡️</span> 安全加固建议
        </h2>
        <div className="rounded-xl p-6 space-y-3" style={{ backgroundColor: "var(--teal-light)", border: "1px solid #99f6e4" }}>
          {["使用环境变量管理 API 密钥，切勿硬编码到代码中", "为每个项目设置独立的 API 密钥和预算上限", "定期审查和轮换所有 API 密钥", "启用所有服务的双因素认证 (2FA)", "交易操作设置最大金额限制和告警机制", "使用沙盒环境进行测试，生产环境与测试环境严格隔离"].map((tip) => (
            <div key={tip} className="flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0" style={{ color: "var(--teal)" }}>•</span>
              <p className="text-sm" style={{ color: "#0f766e" }}>{tip}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      <section className="mb-12">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <span>📊</span> 竞品对比
        </h2>
        <div className="overflow-x-auto rounded-xl shadow-warm" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th className="text-left p-3 font-semibold" style={{ color: "var(--foreground)", backgroundColor: "var(--surface)" }}>工具</th>
                {FEATURES.map((f) => (
                  <th key={f} className="p-3 text-center font-semibold text-xs" style={{ color: "var(--foreground)", backgroundColor: "var(--surface)" }}>{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map((c) => (
                <tr key={c.name} className="transition-colors" style={c.highlight ? { backgroundColor: "var(--accent-light)" } : { backgroundColor: "var(--card-bg)" }}>
                  <td className="p-3 font-medium" style={{ color: c.highlight ? "var(--accent-hover)" : "var(--foreground)" }}>
                    {c.name}
                    <span className="block text-xs" style={{ color: "var(--muted)" }}>{c.type}</span>
                  </td>
                  {c.features.map((has, i) => (
                    <td key={i} className="p-3 text-center">
                      {has ? (
                        <span className="inline-flex w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center text-sm font-bold">✓</span>
                      ) : (
                        <span className="inline-flex w-6 h-6 rounded-full items-center justify-center text-sm" style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}>—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="section-divider" />

      <section>
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <span>🛠</span> 技术栈
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[{ name: "Next.js", desc: "全栈框架" }, { name: "TypeScript", desc: "类型安全" }, { name: "Tailwind CSS", desc: "样式系统" }, { name: "Supabase", desc: "数据库" }, { name: "Vercel", desc: "部署平台" }, { name: "react-markdown", desc: "内容渲染" }].map((tech) => (
            <div key={tech.name} className="rounded-xl p-4 text-center transition-all duration-200 shadow-warm hover:shadow-warm-lg hover:-translate-y-0.5" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}>
              <div className="font-semibold" style={{ color: "var(--foreground)" }}>{tech.name}</div>
              <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{tech.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
