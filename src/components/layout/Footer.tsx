import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-gray-800 mb-2">MoneyAgent</h3>
            <p className="text-sm text-gray-500">
              用 AI 赚钱的完全指南，涵盖 33 种方法和 5 大商业模式。
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">导航</h4>
            <div className="flex flex-col gap-1 text-sm text-gray-500">
              <Link href="/methods" className="hover:text-indigo-600">赚钱方法</Link>
              <Link href="/models" className="hover:text-indigo-600">商业模式</Link>
              <Link href="/tools" className="hover:text-indigo-600">实用工具</Link>
              <Link href="/guide" className="hover:text-indigo-600">入门指南</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">声明</h4>
            <p className="text-xs text-gray-400">
              本站内容仅供参考，不构成投资建议。加密货币等高风险方向请谨慎评估。
            </p>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} MoneyAgent. Built with Next.js + Supabase.
        </div>
      </div>
    </footer>
  );
}
