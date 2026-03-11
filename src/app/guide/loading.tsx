export default function GuideLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header skeleton */}
      <div className="text-center mb-10">
        <div className="h-10 w-48 bg-gray-200 rounded-lg mx-auto mb-3 animate-pulse" />
        <div className="h-5 w-72 bg-gray-100 rounded mx-auto animate-pulse" />
      </div>

      {/* Table of contents skeleton */}
      <div className="bg-gray-50 rounded-xl p-6 mb-10 animate-pulse">
        <div className="h-4 w-12 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-3 w-48 bg-gray-200 rounded" />
          ))}
        </div>
      </div>

      {/* Accordion sections skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-xl overflow-hidden animate-pulse">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50">
              <div className="h-5 w-40 bg-gray-200 rounded" />
              <div className="h-5 w-5 bg-gray-200 rounded" />
            </div>
            {i === 0 && (
              <div className="px-6 py-6 border-t border-gray-100 space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-3 bg-gray-100 rounded"
                    style={{ width: `${90 - (j % 3) * 10}%` }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
