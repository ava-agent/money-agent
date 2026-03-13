import { CurrencyInfo } from "./types";

export const CURRENCIES: CurrencyInfo[] = [
  { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳", decimals: 2 },
  { code: "USD", name: "US Dollar", flag: "🇺🇸", decimals: 2 },
  { code: "EUR", name: "Euro", flag: "🇪🇺", decimals: 2 },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", decimals: 2 },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", decimals: 0 },
  { code: "KRW", name: "South Korean Won", flag: "🇰🇷", decimals: 0 },
  { code: "HKD", name: "Hong Kong Dollar", flag: "🇭🇰", decimals: 2 },
  { code: "TWD", name: "New Taiwan Dollar", flag: "🇹🇼", decimals: 2 },
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬", decimals: 2 },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺", decimals: 2 },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦", decimals: 2 },
  { code: "CHF", name: "Swiss Franc", flag: "🇨🇭", decimals: 2 },
  { code: "NZD", name: "New Zealand Dollar", flag: "🇳🇿", decimals: 2 },
  { code: "THB", name: "Thai Baht", flag: "🇹🇭", decimals: 2 },
  { code: "MYR", name: "Malaysian Ringgit", flag: "🇲🇾", decimals: 2 },
  { code: "PHP", name: "Philippine Peso", flag: "🇵🇭", decimals: 2 },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳", decimals: 2 },
  { code: "RUB", name: "Russian Ruble", flag: "🇷🇺", decimals: 2 },
];

export const CURRENCY_MAP = new Map(CURRENCIES.map((c) => [c.code, c]));

export const SUPPORTED_CODES = new Set(CURRENCIES.map((c) => c.code));
