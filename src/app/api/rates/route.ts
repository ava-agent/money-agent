import { NextResponse } from "next/server";
import { getCachedRates, setCachedRates } from "@/lib/cache";
import { SUPPORTED_CODES } from "@/lib/currencies";
import { ExchangeRateAPIResponse, RatesResponse } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = (searchParams.get("base") || "USD").toUpperCase();

  if (!SUPPORTED_CODES.has(base)) {
    return NextResponse.json(
      { error: `Unsupported currency: ${base}` },
      { status: 400 }
    );
  }

  const cached = getCachedRates(base);
  if (cached) {
    return buildResponse(cached, base);
  }

  try {
    const res = await fetch(
      `https://open.er-api.com/v6/latest/${base}`,
      { next: { revalidate: 600 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch exchange rates" },
        { status: 502 }
      );
    }

    const data: ExchangeRateAPIResponse = await res.json();

    if (data.result !== "success") {
      return NextResponse.json(
        { error: "Exchange rate API returned error" },
        { status: 502 }
      );
    }

    setCachedRates(base, data);
    return buildResponse(data, base);
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to exchange rate service" },
      { status: 502 }
    );
  }
}

function buildResponse(
  data: ExchangeRateAPIResponse,
  base: string
): NextResponse<RatesResponse> {
  const filteredRates: Record<string, number> = {};
  for (const code of SUPPORTED_CODES) {
    if (data.rates[code] !== undefined) {
      filteredRates[code] = data.rates[code];
    }
  }

  return NextResponse.json(
    {
      base,
      rates: filteredRates,
      lastUpdated: data.time_last_update_utc,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60",
      },
    }
  );
}
