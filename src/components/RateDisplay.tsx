"use client";

interface RateDisplayProps {
  fromCode: string;
  toCode: string;
  rate: number | null;
  lastUpdated: string | null;
  isLoading: boolean;
}

function formatUpdateTime(utcStr: string): string {
  try {
    const date = new Date(utcStr);
    if (isNaN(date.getTime())) return utcStr;
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return utcStr;
  }
}

export default function RateDisplay({
  fromCode,
  toCode,
  rate,
  lastUpdated,
  isLoading,
}: RateDisplayProps) {
  if (isLoading) {
    return (
      <div className="mt-4 text-center space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-36 mx-auto" />
      </div>
    );
  }

  if (rate === null) return null;

  const formatRate = (r: number) => {
    if (r >= 1000) return r.toFixed(2);
    if (r >= 1) return r.toFixed(4);
    return r.toFixed(6);
  };

  return (
    <div className="mt-4 text-center text-sm text-gray-500 space-y-1">
      <p>
        Rate: 1 {fromCode} = {formatRate(rate)} {toCode}
      </p>
      {lastUpdated && (
        <p className="text-xs text-gray-400">
          Updated: {formatUpdateTime(lastUpdated)}
        </p>
      )}
    </div>
  );
}
