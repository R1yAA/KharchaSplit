import type { Category } from "./categories";

export const DEFAULT_INVESTMENT_CATEGORIES: Category[] = [
  { id: "mutual-fund", emoji: "📊", name: "Mutual Fund" },
  { id: "stocks", emoji: "📈", name: "Stocks" },
  { id: "fixed-deposit", emoji: "🏦", name: "Fixed Deposit" },
  { id: "gold", emoji: "🪙", name: "Gold" },
  { id: "crypto", emoji: "💎", name: "Crypto" },
  { id: "real-estate", emoji: "🏠", name: "Real Estate" },
  { id: "ppf-epf", emoji: "🏛️", name: "PPF / EPF" },
  { id: "nps", emoji: "💰", name: "NPS" },
  { id: "bonds", emoji: "📄", name: "Bonds" },
  { id: "savings", emoji: "🔒", name: "Savings Account" },
  { id: "other-inv", emoji: "📦", name: "Other" },
];

const CUSTOM_KEY = "kharcha.customInvestmentCategories";

function readCustoms(): Category[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? (JSON.parse(raw) as Category[]) : [];
  } catch {
    return [];
  }
}

export function investmentCategoryById(id: string): Category {
  const builtin = DEFAULT_INVESTMENT_CATEGORIES.find((c) => c.id === id);
  if (builtin) return builtin;
  const custom = readCustoms().find((c) => c.id === id);
  if (custom) return custom;
  return DEFAULT_INVESTMENT_CATEGORIES[DEFAULT_INVESTMENT_CATEGORIES.length - 1];
}
