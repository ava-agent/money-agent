export default function ModelsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header skeleton */}
      <div className="text-center mb-10">
        <div className="h-10 w-72 bg-gray-200 rounded-lg mx-auto mb-3 animate-pulse" />
        <div className="h-5 w-80 bg-gray-100 rounded mx-auto animate-pulse" />
      </div>

      {/* Card list skeleton */}
      <div className="space-y-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-5 w-1/3 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-1/4 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-100 rounded" />
              <div className="h-3 w-5/6 bg-gray-100 rounded" />
              <div className="h-3 w-2/3 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
