export interface Category {
  id: string;
  emoji: string;
  name: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "food", emoji: "🍕", name: "Food & Drinks" },
  { id: "transport", emoji: "🚕", name: "Transport" },
  { id: "stay", emoji: "🏨", name: "Accommodation" },
  { id: "shopping", emoji: "🛒", name: "Shopping" },
  { id: "entertainment", emoji: "🎮", name: "Entertainment" },
  { id: "health", emoji: "💊", name: "Health" },
  { id: "utilities", emoji: "📱", name: "Utilities" },
  { id: "other", emoji: "📦", name: "Other" },
];

export const GROUP_ICONS = ["🏖", "🏠", "🍕", "✈️", "🎉", "🏕", "🚗", "💼", "🎓", "❤️", "🛒", "🎮"];

const CUSTOM_KEY = "kharcha.customCategories";

function readCustoms(): Category[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? (JSON.parse(raw) as Category[]) : [];
  } catch {
    return [];
  }
}

export function categoryById(id: string): Category {
  const builtin = DEFAULT_CATEGORIES.find((c) => c.id === id);
  if (builtin) return builtin;
  const custom = readCustoms().find((c) => c.id === id);
  if (custom) return custom;
  return DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
}
