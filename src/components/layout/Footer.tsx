import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto" style={{ backgroundColor: "#1a1b3a", color: "rgba(255,255,255,0.5)" }}>
      {/* Top accent line */}
      <div className="h-[1px]" style={{ background: "linear-gradient(to right, transparent, var(--accent), var(--teal), transparent)" }} />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-white mb-3">
              Money<span style={{ color: "var(--accent)" }}>Agent</span>
            </h3>
            <p className="text-sm leading-relaxed">
              用 AI 赚钱的完全指南，涵盖 33 种方法和 5 大商业模式。
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">导航</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/methods" className="hover:text-white transition-colors">赚钱方法</Link>
              <Link href="/models" className="hover:text-white transition-colors">商业模式</Link>
              <Link href="/tools" className="hover:text-white transition-colors">实用工具</Link>
              <Link href="/guide" className="hover:text-white transition-colors">入门指南</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">声明</h4>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
              本站内容仅供参考，不构成投资建议。加密货币等高风险方向请谨慎评估。
            </p>
          </div>
        </div>
        <div className="mt-10 pt-6 text-center text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)" }}>
          &copy; {new Date().getFullYear()} MoneyAgent. Built with Next.js + Supabase.
        </div>
      </div>
    </footer>
  );
}
