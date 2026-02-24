import { ExchangeRateAPIResponse } from "./types";

interface CacheEntry {
  data: ExchangeRateAPIResponse;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function getCachedRates(
  base: string
): ExchangeRateAPIResponse | null {
  const entry = cache.get(base);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

export function setCachedRates(
  base: string,
  data: ExchangeRateAPIResponse
): void {
  cache.set(base, { data, timestamp: Date.now() });
}
