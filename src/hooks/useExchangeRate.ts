"use client";

import { useCallback, useEffect, useState } from "react";
import { RatesResponse } from "@/lib/types";

export function useExchangeRate() {
  const [data, setData] = useState<RatesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rates?base=USD");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "获取汇率失败");
      }
      const json: RatesResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取汇率失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const convert = useCallback(
    (amount: number, from: string, to: string): number | null => {
      if (!data?.rates) return null;
      const fromRate = data.rates[from];
      const toRate = data.rates[to];
      if (fromRate === undefined || toRate === undefined) return null;
      return amount * (toRate / fromRate);
    },
    [data]
  );

  return { data, isLoading, error, convert, refetch: fetchRates };
}
