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
        <h2 className="text-xl font-bold text-gray-900 mb-4">项目简介</h2>
        <div className="prose prose-indigo max-w-none text-gray-600">
          <p>
            MoneyAgent 是一个基于 AI 技术的赚钱方法指南网站，整理了 <strong>33 种</strong> 经过验证的 AI 赚钱方法和 <strong>5 大高收入商业模式</strong>。
          </p>
          <p>
            内容来源于 OpenClaw 社区整理的实操经验，涵盖工作替代、投资管理、内容生产、技术服务等 <strong>8 大类别</strong>。我们的目标是帮助你找到最适合自己的 AI 变现路径。
          </p>
        </div>
      </section>

      <div className="section-divider" />

      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>⚠️</span> 重要风险提示
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-3">
          {["AI 工具会犯错：永远在执行前审查 AI 的输出，尤其涉及金融操作", "加密货币极高风险：永远不要投入超过你能承受损失的金额", "遵守当地法律：不同国家/地区对 AI 使用和金融活动有不同规定", "没有保证的收入：所有收入数字都是估算范围，实际结果因人而异", "API 成本累积快：未优化的自动化可能在你意识到之前烧完大量费用", "安全第一：涉及金融 API 的密钥要妥善保管，启用 2FA"].map((warning) => (
            <div key={warning} className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>
              <p className="text-sm text-red-700">{warning}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🛡️</span> 安全加固建议
        </h2>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-3">
          {["使用环境变量管理 API 密钥，切勿硬编码到代码中", "为每个项目设置独立的 API 密钥和预算上限", "定期审查和轮换所有 API 密钥", "启用所有服务的双因素认证 (2FA)", "交易操作设置最大金额限制和告警机制", "使用沙盒环境进行测试，生产环境与测试环境严格隔离"].map((tip) => (
            <div key={tip} className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
              <p className="text-sm text-blue-700">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>📊</span> 竞品对比
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-700">工具</th>
                {FEATURES.map((f) => (
                  <th key={f} className="p-3 text-center font-semibold text-gray-700 text-xs">{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map((c) => (
                <tr key={c.name} className={c.highlight ? "bg-indigo-50" : "hover:bg-gray-50"}>
                  <td className={`p-3 font-medium ${c.highlight ? "text-indigo-700" : "text-gray-800"}`}>
                    {c.name}
                    <span className="block text-xs text-gray-400">{c.type}</span>
                  </td>
                  {c.features.map((has, i) => (
                    <td key={i} className="p-3 text-center">
                      {has ? (
                        <span className="inline-flex w-6 h-6 rounded-full bg-green-100 text-green-600 items-center justify-center text-sm font-bold">✓</span>
                      ) : (
                        <span className="inline-flex w-6 h-6 rounded-full bg-gray-100 text-gray-400 items-center justify-center text-sm">—</span>
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
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🛠</span> 技术栈
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[{ name: "Next.js", desc: "全栈框架" }, { name: "TypeScript", desc: "类型安全" }, { name: "Tailwind CSS", desc: "样式系统" }, { name: "Supabase", desc: "数据库" }, { name: "Vercel", desc: "部署平台" }, { name: "react-markdown", desc: "内容渲染" }].map((tech) => (
            <div key={tech.name} className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors">
              <div className="font-semibold text-gray-800">{tech.name}</div>
              <div className="text-xs text-gray-500">{tech.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
