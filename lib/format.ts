// Indian number formatting helpers.
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const inrNoSymbol = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

export const formatINR = (n: number) => inr.format(n);
export const formatNumberIN = (n: number) => inrNoSymbol.format(n);

export function formatDateShort(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function relativeDay(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const today = new Date();
  const diff = Math.floor((today.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return `${diff}d ago`;
  return formatDateShort(date);
}
