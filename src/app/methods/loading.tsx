export default function MethodsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header skeleton */}
      <div className="text-center mb-10">
        <div className="h-10 w-64 bg-gray-200 rounded-lg mx-auto mb-3 animate-pulse" />
        <div className="h-5 w-96 bg-gray-100 rounded mx-auto animate-pulse" />
      </div>

      {/* Stats bar skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse">
            <div className="h-7 w-10 bg-gray-200 rounded mx-auto mb-2" />
            <div className="h-3 w-12 bg-gray-200 rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded mb-2" />
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
