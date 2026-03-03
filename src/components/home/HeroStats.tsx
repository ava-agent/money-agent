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
    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
      {STATS.map((stat) => (
        <div key={stat.label} className="group">
          <div className="text-3xl md:text-4xl font-bold">
            <AnimatedCounter
              target={stat.target}
              prefix={stat.prefix}
              suffix={stat.suffix}
            />
          </div>
          <div className="text-sm text-indigo-200 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
