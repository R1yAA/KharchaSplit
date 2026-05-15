// Recurrence engine for KharchaSplit v2.
// Rules don't auto-run in background — the app checks on load and the user confirms.

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type RecurrenceEndType = "never" | "on_date" | "after_count";
export type RuleType = "expense" | "valuation";

export interface RecurringRule {
  id: string;
  workspace: string;
  rule_type: RuleType;
  template: Record<string, unknown>;
  frequency: RecurrenceFrequency;
  anchor_day: number | null;
  end_type: RecurrenceEndType;
  end_date: string | null;
  end_count: number | null;
  generated_count: number;
  last_generated_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseISO(s: string): Date {
  return new Date(s + "T00:00:00");
}
function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function lastDayOfMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

/** Earliest date this rule should fire next (or first fire date if never fired). Returns null if rule has ended. */
export function getNextDueDate(rule: RecurringRule, today: Date = new Date()): string | null {
  if (!rule.is_active) return null;
  if (rule.end_type === "after_count" && rule.end_count != null && rule.generated_count >= rule.end_count) return null;

  const last = rule.last_generated_date ? parseISO(rule.last_generated_date) : null;

  let next: Date;
  switch (rule.frequency) {
    case "daily":
      next = last ? new Date(last.getTime() + DAY_MS) : new Date(today);
      break;
    case "weekly": {
      const targetDow = rule.anchor_day ?? today.getDay();
      const start = last ? new Date(last.getTime() + DAY_MS) : new Date(today);
      const diff = (targetDow - start.getDay() + 7) % 7;
      next = new Date(start.getTime() + diff * DAY_MS);
      break;
    }
    case "monthly": {
      const anchor = rule.anchor_day ?? today.getDate();
      const base = last ?? today;
      const year = base.getFullYear();
      const month = last ? base.getMonth() + 1 : base.getMonth();
      const dayInMonth = Math.min(anchor, lastDayOfMonth(year, month));
      next = new Date(year, month, dayInMonth);
      if (!last && next < today) {
        const nm = month + 1;
        const d2 = Math.min(anchor, lastDayOfMonth(year, nm));
        next = new Date(year, nm, d2);
      }
      break;
    }
    case "yearly": {
      const encoded = rule.anchor_day ?? today.getMonth() * 100 + today.getDate();
      const m = Math.floor(encoded / 100);
      const d = encoded % 100;
      const baseYear = last ? last.getFullYear() + 1 : today.getFullYear();
      const day = Math.min(d, lastDayOfMonth(baseYear, m));
      next = new Date(baseYear, m, day);
      if (!last && next < today) {
        const day2 = Math.min(d, lastDayOfMonth(baseYear + 1, m));
        next = new Date(baseYear + 1, m, day2);
      }
      break;
    }
  }

  if (rule.end_type === "on_date" && rule.end_date && next > parseISO(rule.end_date)) return null;
  return toISO(next);
}

export interface DueOccurrence {
  rule: RecurringRule;
  date: string;
}

/** For a list of rules + today's date, returns every (rule, date) tuple that is due (potentially multiple per rule if backlogged). */
export function listDueOccurrences(rules: RecurringRule[], today: Date = new Date()): DueOccurrence[] {
  const out: DueOccurrence[] = [];
  const todayStr = toISO(today);
  for (const rule of rules) {
    if (!rule.is_active) continue;
    // Walk forward from next_due_date, accumulating up to a sane backlog cap.
    let working = { ...rule } as RecurringRule;
    const MAX = 24; // safety: stop after 24 stacked occurrences
    for (let i = 0; i < MAX; i++) {
      const next = getNextDueDate(working, today);
      if (!next || next > todayStr) break;
      out.push({ rule, date: next });
      working = {
        ...working,
        last_generated_date: next,
        generated_count: working.generated_count + 1,
      };
      if (working.end_type === "after_count" && working.end_count != null && working.generated_count >= working.end_count) break;
      if (working.end_type === "on_date" && working.end_date && next >= working.end_date) break;
    }
  }
  return out;
}
