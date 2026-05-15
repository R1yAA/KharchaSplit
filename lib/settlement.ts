import type { ExpenseRow } from "./supabase/types";

export interface Balance {
  member: string;
  net: number; // positive = is owed; negative = owes
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

/**
 * Compute per-member net balances for a group from expense rows.
 * - Multi-payer: uses paid_by_members + paid_by_amounts when present.
 * - Single-payer fallback: uses paid_by + amount.
 * - Splits: uses split_amounts for unequal, otherwise even split across split_members
 *   (defaults to all group members if split_members is empty).
 */
export function computeBalances(expenses: ExpenseRow[], members: string[]): Balance[] {
  const net = new Map<string, number>();
  for (const m of members) net.set(m, 0);

  for (const e of expenses) {
    // Credits (who paid)
    if (e.paid_by_members && e.paid_by_members.length > 0 && e.paid_by_amounts && e.paid_by_amounts.length === e.paid_by_members.length) {
      e.paid_by_members.forEach((m, i) => {
        net.set(m, (net.get(m) ?? 0) + Number(e.paid_by_amounts![i]));
      });
    } else if (e.paid_by) {
      net.set(e.paid_by, (net.get(e.paid_by) ?? 0) + Number(e.amount));
    }

    // Debits (who owes)
    const splitOver = e.split_members && e.split_members.length > 0 ? e.split_members : members;
    if (e.split_type === "unequal" && e.split_amounts && e.split_amounts.length === splitOver.length) {
      splitOver.forEach((m, i) => {
        net.set(m, (net.get(m) ?? 0) - Number(e.split_amounts![i]));
      });
    } else {
      const share = Number(e.amount) / splitOver.length;
      for (const m of splitOver) net.set(m, (net.get(m) ?? 0) - share);
    }
  }

  return Array.from(net.entries()).map(([member, n]) => ({ member, net: round2(n) }));
}

/**
 * Greedy minimum-transfers algorithm.
 * Returns a list of (from → to, amount) settling all balances.
 */
export function minimizeTransfers(balances: Balance[]): Transfer[] {
  const creditors = balances.filter((b) => b.net > 0.01).map((b) => ({ ...b }));
  const debtors = balances.filter((b) => b.net < -0.01).map((b) => ({ ...b, net: -b.net }));
  creditors.sort((a, b) => b.net - a.net);
  debtors.sort((a, b) => b.net - a.net);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].net, creditors[j].net);
    transfers.push({ from: debtors[i].member, to: creditors[j].member, amount: round2(pay) });
    debtors[i].net -= pay;
    creditors[j].net -= pay;
    if (debtors[i].net < 0.01) i++;
    if (creditors[j].net < 0.01) j++;
  }
  return transfers;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
