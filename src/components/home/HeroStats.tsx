"use client";

import AnimatedCounter from "./AnimatedCounter";

const STATS = [
  { target: 33, suffix: "", label: "赚钱方法" },
  { target: 8, suffix: "", label: "大类别" },
  { target: 5, suffix: "", label: "高收入模式" },
  { target: 10, prefix: "$", suffix: "K+", label: "月收入潜力" },
];

export default function HeroStats() {
  return (
    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-0 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)", backdropFilter: "blur(8px)" }}>
      {STATS.map((stat, index) => (
        <div
          key={stat.label}
          className="text-center py-6 px-4"
          style={index < 3 ? { borderRight: "1px solid rgba(255,255,255,0.08)" } : {}}
        >
          <div className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold" style={{ color: "var(--accent)" }}>
            <AnimatedCounter
              target={stat.target}
              prefix={stat.prefix}
              suffix={stat.suffix}
            />
          </div>
          <div className="text-sm mt-2 tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
