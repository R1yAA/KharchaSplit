import type { ExpenseRow, GroupRow } from "./supabase/types";

function escape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toLine(cells: unknown[]): string {
  return cells.map(escape).join(",");
}

export function groupExpensesToCsv(expenses: ExpenseRow[]): string {
  const header = ["Date", "Title", "Category", "Amount (INR)", "Paid By", "Split Type", "Split Between", "Note"];
  const lines = [toLine(header)];
  for (const e of expenses) {
    lines.push(
      toLine([
        e.date,
        e.title,
        e.category,
        e.amount,
        (e.paid_by_members && e.paid_by_members.length > 0 ? e.paid_by_members.join(", ") : e.paid_by) ?? "",
        e.split_type,
        (e.split_members ?? []).join(", "),
        e.note ?? "",
      ]),
    );
  }
  return lines.join("\n");
}

export function personalExpensesToCsv(expenses: ExpenseRow[]): string {
  const header = ["Date", "Title", "Category", "Amount (INR)", "Note"];
  const lines = [toLine(header)];
  for (const e of expenses) lines.push(toLine([e.date, e.title, e.category, e.amount, e.note ?? ""]));
  return lines.join("\n");
}

export function fullExportToCsv(expenses: ExpenseRow[], groupsById: Map<string, GroupRow>): string {
  const header = ["Group", "Date", "Title", "Category", "Amount (INR)", "Paid By", "Split Type", "Split Between", "Note"];
  const lines = [toLine(header)];
  for (const e of expenses) {
    const group = e.group_id ? groupsById.get(e.group_id)?.name ?? "" : "";
    lines.push(
      toLine([
        group,
        e.date,
        e.title,
        e.category,
        e.amount,
        (e.paid_by_members && e.paid_by_members.length > 0 ? e.paid_by_members.join(", ") : e.paid_by) ?? "",
        e.split_type,
        (e.split_members ?? []).join(", "),
        e.note ?? "",
      ]),
    );
  }
  return lines.join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
