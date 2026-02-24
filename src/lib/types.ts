export interface ExchangeRateAPIResponse {
  result: string;
  base_code: string;
  time_last_update_utc: string;
  time_last_update_unix: number;
  rates: Record<string, number>;
}

export interface RatesResponse {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  flag: string;
  decimals: number;
}
