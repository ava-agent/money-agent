import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          用 AI 赚钱的完全指南
        </h1>
        <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
          33 种经过验证的赚钱方法，5 大高收入商业模式，从零到月入 $10K+ 的实操路线图
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/methods"
            className="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
          >
            探索 33 种方法
          </Link>
          <Link
            href="/models"
            className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-400 transition-colors border border-indigo-400"
          >
            高收入模式
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { number: "33", label: "赚钱方法" },
            { number: "8", label: "大类别" },
            { number: "5", label: "高收入模式" },
            { number: "$10K+", label: "月收入潜力" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl md:text-4xl font-bold">{stat.number}</div>
              <div className="text-sm text-indigo-200 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
