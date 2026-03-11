"use client";

export default function MethodsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">加载赚钱方法失败</h2>
      <p className="text-gray-500 mb-6 text-sm">{error.message}</p>
      <button
        onClick={reset}
        className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
      >
        重试
      </button>
    </div>
  );
}
