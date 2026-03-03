import HeroSection from "@/components/home/HeroSection";
import FeatureCard from "@/components/home/FeatureCard";
import FadeInOnScroll from "@/components/shared/FadeInOnScroll";

const FEATURES = [
  {
    icon: "💰",
    title: "33 种赚钱方法",
    description: "涵盖工作替代、投资管理、内容生产、技术服务等 8 大类别的实操方法。",
    href: "/methods",
  },
  {
    icon: "🚀",
    title: "5 大高收入模式",
    description: "月入 $10K+ 的商业模式详解，包含定价策略和实际案例。",
    href: "/models",
  },
  {
    icon: "💱",
    title: "汇率换算器",
    description: "支持 18 种主要货币的实时汇率换算工具。",
    href: "/tools",
  },
  {
    icon: "📖",
    title: "入门指南",
    description: "从零开始的安装部署教程、30 天行动路线图。",
    href: "/guide",
  },
  {
    icon: "🛡️",
    title: "安全与风险",
    description: "重要风险提示、安全加固指南和成本优化建议。",
    href: "/about",
  },
  {
    icon: "📊",
    title: "竞品对比",
    description: "与 Manus AI、AutoGPT、n8n 等工具的全面对比分析。",
    href: "/about",
  },
];

export default function Home() {
  return (
    <div>
      <HeroSection />
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          探索完整内容
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, index) => (
            <FadeInOnScroll key={f.title} delay={index * 100}>
              <FeatureCard {...f} />
            </FadeInOnScroll>
          ))}
        </div>
      </section>
    </div>
  );
}
