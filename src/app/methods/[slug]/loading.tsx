export default function MethodDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Back link skeleton */}
      <div className="h-4 w-20 bg-gray-200 rounded mb-6 animate-pulse" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* Main content */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-7 w-3/4 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-3 mb-8">
            <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="border-t border-gray-100 pt-8 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-4 bg-gray-100 rounded animate-pulse"
                style={{ width: `${85 - (i % 3) * 15}%` }}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside>
          <div className="rounded-xl border-2 border-gray-200 overflow-hidden animate-pulse">
            <div className="bg-gray-100 px-5 py-4">
              <div className="h-6 w-32 bg-gray-200 rounded" />
            </div>
            <div className="p-5 space-y-5 bg-white">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-16 bg-gray-100 rounded mb-2" />
                  <div className="h-5 w-24 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
