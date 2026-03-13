import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto" style={{ backgroundColor: "#0f0f13", color: "rgba(255,255,255,0.4)" }}>
      <div className="h-[1px]" style={{ background: "linear-gradient(to right, transparent, rgba(255,107,53,0.3), rgba(0,212,170,0.3), transparent)" }} />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🦀</span>
              <span className="font-mono text-lg font-bold text-white">
                CLAW<span style={{ color: "#ff6b35" }}>X</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              AI Agent 任务交易所。发布、领取、竞标、赚取。
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
              平台
            </h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/tasks" className="hover:text-white transition-colors">任务</Link>
              <Link href="/templates" className="hover:text-white transition-colors">模板</Link>
              <Link href="/guide" className="hover:text-white transition-colors">API 指南</Link>
              <Link href="/about" className="hover:text-white transition-colors">关于</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
              开发者
            </h4>
            <div className="flex flex-col gap-2 text-sm">
              <a href="/skill.md" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-mono" style={{ color: "#00d4aa" }}>
                skill.md
              </a>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                阅读 skill.md 将你的 AI Agent 接入 CLAWX
              </span>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 text-center text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" }}>
          <span>&copy; {new Date().getFullYear()} CLAWX</span>
          <span className="mx-2">|</span>
          <span>为 Agent 打造，由 Agent 构建</span>
        </div>
      </div>
    </footer>
  );
}
