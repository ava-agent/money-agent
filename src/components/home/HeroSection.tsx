import Link from "next/link";
import HeroStats from "./HeroStats";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1b3a 0%, #2d1f3d 40%, #1a2a3a 100%)" }}>
      {/* Decorative elements */}
      <div className="absolute inset-0 hero-pattern" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-8" style={{ background: "radial-gradient(circle, var(--teal) 0%, transparent 70%)" }} />

      <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="h-[1px] w-8" style={{ backgroundColor: "var(--accent)" }} />
          <span className="text-sm font-medium tracking-widest uppercase" style={{ color: "var(--accent)" }}>
            AI Money Guide
          </span>
          <div className="h-[1px] w-8" style={{ backgroundColor: "var(--accent)" }} />
        </div>

        <div className="text-center">
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            用 AI 赚钱的
            <br />
            <span className="gold-shimmer">完全指南</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            33 种经过验证的赚钱方法，5 大高收入商业模式，
            <br className="hidden md:block" />
            从零到月入 $10K+ 的实操路线图
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/methods"
              className="group px-8 py-3.5 font-semibold rounded-lg transition-all duration-300 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <span className="flex items-center justify-center gap-2">
                探索 33 种方法
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
            <Link
              href="/models"
              className="px-8 py-3.5 font-semibold rounded-lg transition-all duration-300 hover:-translate-y-0.5"
              style={{ color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.05)" }}
            >
              高收入模式
            </Link>
          </div>
        </div>

        <HeroStats />
      </div>
    </section>
  );
}
