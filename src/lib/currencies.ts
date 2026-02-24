import { CurrencyInfo } from "./types";

export const CURRENCIES: CurrencyInfo[] = [
  { code: "CNY", name: "人民币", flag: "🇨🇳", decimals: 2 },
  { code: "USD", name: "美元", flag: "🇺🇸", decimals: 2 },
  { code: "EUR", name: "欧元", flag: "🇪🇺", decimals: 2 },
  { code: "GBP", name: "英镑", flag: "🇬🇧", decimals: 2 },
  { code: "JPY", name: "日元", flag: "🇯🇵", decimals: 0 },
  { code: "KRW", name: "韩元", flag: "🇰🇷", decimals: 0 },
  { code: "HKD", name: "港币", flag: "🇭🇰", decimals: 2 },
  { code: "TWD", name: "新台币", flag: "🇹🇼", decimals: 2 },
  { code: "SGD", name: "新加坡元", flag: "🇸🇬", decimals: 2 },
  { code: "AUD", name: "澳元", flag: "🇦🇺", decimals: 2 },
  { code: "CAD", name: "加元", flag: "🇨🇦", decimals: 2 },
  { code: "CHF", name: "瑞士法郎", flag: "🇨🇭", decimals: 2 },
  { code: "NZD", name: "新西兰元", flag: "🇳🇿", decimals: 2 },
  { code: "THB", name: "泰铢", flag: "🇹🇭", decimals: 2 },
  { code: "MYR", name: "马来西亚林吉特", flag: "🇲🇾", decimals: 2 },
  { code: "PHP", name: "菲律宾比索", flag: "🇵🇭", decimals: 2 },
  { code: "INR", name: "印度卢比", flag: "🇮🇳", decimals: 2 },
  { code: "RUB", name: "俄罗斯卢布", flag: "🇷🇺", decimals: 2 },
];

export const CURRENCY_MAP = new Map(CURRENCIES.map((c) => [c.code, c]));

export const SUPPORTED_CODES = new Set(CURRENCIES.map((c) => c.code));
