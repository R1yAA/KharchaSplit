// Investment computations: portfolio summary, monthly timeline.
// XIRR omitted for v2 (returns null until implemented).

export interface InvestmentRow {
  id: string;
  workspace: string;
  name: string;
  category: string;
  principal: number;
  start_date: string;
  note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ValuationRow {
  id: string;
  workspace: string;
  investment_id: string;
  value: number;
  date: string;
  created_at: string;
}

export interface PortfolioRow {
  id: string;
  name: string;
  category: string;
  principal: number;
  currentValue: number;
  pnL: number;
  returnPct: number;
  lastUpdated: string | null;
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalPnL: number;
  totalReturnPct: number;
  investments: PortfolioRow[];
}

export function latestValuationFor(invId: string, valuations: ValuationRow[]): ValuationRow | null {
  let latest: ValuationRow | null = null;
  for (const v of valuations) {
    if (v.investment_id !== invId) continue;
    if (!latest || v.date > latest.date) latest = v;
  }
  return latest;
}

export function computePortfolioSummary(
  investments: InvestmentRow[],
  valuations: ValuationRow[],
): PortfolioSummary {
  const rows: PortfolioRow[] = [];
  let totalInvested = 0;
  let currentValue = 0;
  for (const inv of investments.filter((i) => i.is_active)) {
    const latest = latestValuationFor(inv.id, valuations);
    const cv = latest ? Number(latest.value) : Number(inv.principal);
    const principal = Number(inv.principal);
    const pnL = cv - principal;
    rows.push({
      id: inv.id,
      name: inv.name,
      category: inv.category,
      principal,
      currentValue: cv,
      pnL,
      returnPct: principal > 0 ? (pnL / principal) * 100 : 0,
      lastUpdated: latest?.date ?? null,
    });
    totalInvested += principal;
    currentValue += cv;
  }
  const totalPnL = currentValue - totalInvested;
  return {
    totalInvested,
    currentValue,
    totalPnL,
    totalReturnPct: totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0,
    investments: rows,
  };
}

/** Returns last `months` months ending at the current month, with the carry-forward portfolio value at each month-end. */
export function getMonthlyPortfolioTimeline(
  investments: InvestmentRow[],
  valuations: ValuationRow[],
  months = 12,
): { month: string; label: string; value: number; invested: number }[] {
  const now = new Date();
  const out: { month: string; label: string; value: number; invested: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0); // last day of that month
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    let value = 0;
    let invested = 0;
    for (const inv of investments) {
      if (new Date(inv.start_date) > d) continue;
      invested += Number(inv.principal);
      // latest valuation on or before d
      let latest: ValuationRow | null = null;
      for (const v of valuations) {
        if (v.investment_id !== inv.id) continue;
        if (v.date > toISO(d)) continue;
        if (!latest || v.date > latest.date) latest = v;
      }
      value += latest ? Number(latest.value) : Number(inv.principal);
    }
    out.push({ month: key, label, value, invested });
  }
  return out;
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function computeXIRR(
  _principal: number,
  _startDate: string,
  _valuations: ValuationRow[],
): number | null {
  // Newton-Raphson XIRR not implemented in v2. Detail page shows "—".
  return null;
}
