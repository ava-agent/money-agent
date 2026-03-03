export interface CategoryColorSet {
  border: string;
  bg: string;
  bgActive: string;
  text: string;
  hex: string;
}

const CATEGORY_COLORS: Record<string, CategoryColorSet> = {
  "job-replacement": {
    border: "border-cat-job",
    bg: "bg-cat-job-light",
    bgActive: "bg-cat-job-mid",
    text: "text-cat-job",
    hex: "#3b82f6",
  },
  investment: {
    border: "border-cat-invest",
    bg: "bg-cat-invest-light",
    bgActive: "bg-cat-invest-mid",
    text: "text-cat-invest",
    hex: "#10b981",
  },
  content: {
    border: "border-cat-content",
    bg: "bg-cat-content-light",
    bgActive: "bg-cat-content-mid",
    text: "text-cat-content",
    hex: "#f59e0b",
  },
  devops: {
    border: "border-cat-devops",
    bg: "bg-cat-devops-light",
    bgActive: "bg-cat-devops-mid",
    text: "text-cat-devops",
    hex: "#6366f1",
  },
  "life-automation": {
    border: "border-cat-life",
    bg: "bg-cat-life-light",
    bgActive: "bg-cat-life-mid",
    text: "text-cat-life",
    hex: "#ec4899",
  },
  entrepreneurship: {
    border: "border-cat-startup",
    bg: "bg-cat-startup-light",
    bgActive: "bg-cat-startup-mid",
    text: "text-cat-startup",
    hex: "#f97316",
  },
  "data-integration": {
    border: "border-cat-data",
    bg: "bg-cat-data-light",
    bgActive: "bg-cat-data-mid",
    text: "text-cat-data",
    hex: "#8b5cf6",
  },
  crypto: {
    border: "border-cat-crypto",
    bg: "bg-cat-crypto-light",
    bgActive: "bg-cat-crypto-mid",
    text: "text-cat-crypto",
    hex: "#eab308",
  },
};

const DEFAULT_COLORS: CategoryColorSet = {
  border: "border-gray-300",
  bg: "bg-gray-50",
  bgActive: "bg-gray-100",
  text: "text-gray-600",
  hex: "#6b7280",
};

export function getCategoryColors(code: string): CategoryColorSet {
  return CATEGORY_COLORS[code] ?? DEFAULT_COLORS;
}
