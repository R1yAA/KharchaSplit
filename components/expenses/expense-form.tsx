"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { CategoryPicker } from "./category-picker";

export interface ExpenseFormValues {
  title: string;
  amount: number;
  category: string;
  paid_by: string | null;
  paid_by_members: string[];
  paid_by_amounts: number[];
  split_type: "equal" | "unequal";
  split_members: string[];
  split_amounts: number[];
  date: string; // YYYY-MM-DD
  note: string;
}

interface Props {
  members: string[]; // group members (or [self] for personal)
  isPersonal?: boolean;
  initial?: Partial<ExpenseFormValues>;
  submitLabel?: string;
  onSubmit: (v: ExpenseFormValues) => Promise<void> | void;
}

export function ExpenseForm({ members, isPersonal, initial, submitLabel = "Save Expense", onSubmit }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [amount, setAmount] = useState<string>(initial?.amount ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? "other");
  const [date, setDate] = useState(initial?.date ?? today);
  const [note, setNote] = useState(initial?.note ?? "");
  const [advanced, setAdvanced] = useState(false);

  // Payers (multi-payer support)
  const [multiPayer, setMultiPayer] = useState(
    !!(initial?.paid_by_members && initial.paid_by_members.length > 1),
  );
  const [singlePayer, setSinglePayer] = useState(initial?.paid_by ?? members[0] ?? "");
  const [payerSelected, setPayerSelected] = useState<Set<string>>(
    new Set(initial?.paid_by_members?.length ? initial.paid_by_members : []),
  );
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>(() => {
    const r: Record<string, string> = {};
    initial?.paid_by_members?.forEach((m, i) => {
      r[m] = String(initial?.paid_by_amounts?.[i] ?? "");
    });
    return r;
  });

  // Splits
  const [splitMembers, setSplitMembers] = useState<Set<string>>(
    new Set(initial?.split_members?.length ? initial.split_members : members),
  );
  const [splitType, setSplitType] = useState<"equal" | "unequal">(initial?.split_type ?? "equal");
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>(() => {
    const r: Record<string, string> = {};
    initial?.split_members?.forEach((m, i) => {
      r[m] = String(initial?.split_amounts?.[i] ?? "");
    });
    return r;
  });

  const amt = Number(amount) || 0;

  const splitList = useMemo(() => members.filter((m) => splitMembers.has(m)), [members, splitMembers]);

  const splitRemaining = useMemo(() => {
    if (splitType !== "unequal") return 0;
    const sum = splitList.reduce((s, m) => s + (Number(splitAmounts[m]) || 0), 0);
    return Math.round((amt - sum) * 100) / 100;
  }, [splitType, splitList, splitAmounts, amt]);

  const payerList = useMemo(() => members.filter((m) => payerSelected.has(m)), [members, payerSelected]);
  const payerRemaining = useMemo(() => {
    if (!multiPayer) return 0;
    const sum = payerList.reduce((s, m) => s + (Number(payerAmounts[m]) || 0), 0);
    return Math.round((amt - sum) * 100) / 100;
  }, [multiPayer, payerList, payerAmounts, amt]);

  const canSubmit =
    title.trim().length > 0 &&
    amt > 0 &&
    (isPersonal || splitList.length > 0) &&
    (splitType === "equal" || Math.abs(splitRemaining) < 0.01) &&
    (!multiPayer || Math.abs(payerRemaining) < 0.01) &&
    (isPersonal || multiPayer || !!singlePayer);

  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const values: ExpenseFormValues = {
        title: title.trim(),
        amount: amt,
        category,
        paid_by: isPersonal ? null : multiPayer ? null : singlePayer || null,
        paid_by_members: isPersonal ? [] : multiPayer ? payerList : [],
        paid_by_amounts: isPersonal ? [] : multiPayer ? payerList.map((m) => Number(payerAmounts[m]) || 0) : [],
        split_type: splitType,
        split_members: isPersonal ? [] : splitList,
        split_amounts:
          isPersonal || splitType === "equal" ? [] : splitList.map((m) => Number(splitAmounts[m]) || 0),
        date,
        note: note.trim(),
      };
      await onSubmit(values);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Amount */}
      <div className="text-center">
        <div className="text-fg-dim text-xs uppercase tracking-wide">Amount</div>
        <div className="mt-1 flex items-baseline justify-center gap-1">
          <span className="text-3xl font-semibold text-fg-dim">₹</span>
          <input
            inputMode="decimal"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.00"
            className="w-40 bg-transparent text-4xl font-bold text-center focus:outline-none placeholder:text-fg-dim"
          />
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Dinner" maxLength={100} />
      </div>

      {/* Category */}
      <CategoryPicker value={category} onChange={setCategory} />

      {!isPersonal && (
        <>
          {/* Paid by */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Paid by</label>
              <label className="text-xs inline-flex items-center gap-1 text-fg-muted">
                <input type="checkbox" checked={multiPayer} onChange={(e) => setMultiPayer(e.target.checked)} />
                Multiple payers
              </label>
            </div>
            {!multiPayer ? (
              <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto px-1 no-scrollbar">
                {members.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSinglePayer(m)}
                    className={cn(
                      "shrink-0 rounded-full px-3 h-9 text-sm border",
                      singlePayer === m ? "bg-brand text-white border-brand" : "bg-surface border-line",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {members.map((m) => {
                  const sel = payerSelected.has(m);
                  return (
                    <div key={m} className="flex items-center gap-2">
                      <label className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={sel}
                          onChange={(e) => {
                            const next = new Set(payerSelected);
                            if (e.target.checked) next.add(m);
                            else next.delete(m);
                            setPayerSelected(next);
                          }}
                        />
                        <span className="text-sm">{m}</span>
                      </label>
                      <Input
                        disabled={!sel}
                        inputMode="decimal"
                        className="w-28 h-9"
                        placeholder="₹0"
                        value={payerAmounts[m] ?? ""}
                        onChange={(e) =>
                          setPayerAmounts({ ...payerAmounts, [m]: e.target.value.replace(/[^0-9.]/g, "") })
                        }
                      />
                    </div>
                  );
                })}
                <div
                  className={cn(
                    "text-xs",
                    Math.abs(payerRemaining) < 0.01 ? "text-fg-muted" : "text-danger font-medium",
                  )}
                >
                  Remaining: {formatINR(payerRemaining)}
                </div>
              </div>
            )}
          </div>

          {/* Split between */}
          <div>
            <label className="text-sm font-medium">Split between</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {members.map((m) => {
                const sel = splitMembers.has(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      const next = new Set(splitMembers);
                      if (sel) next.delete(m);
                      else next.add(m);
                      setSplitMembers(next);
                    }}
                    className={cn(
                      "rounded-full px-3 h-9 text-sm border",
                      sel ? "bg-brand/10 text-brand border-brand" : "bg-surface border-line",
                    )}
                  >
                    {sel ? "☑ " : "☐ "}
                    {m}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="radio" checked={splitType === "equal"} onChange={() => setSplitType("equal")} /> Equal
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" checked={splitType === "unequal"} onChange={() => setSplitType("unequal")} /> Unequal
              </label>
            </div>
            {splitType === "unequal" && (
              <div className="mt-2 space-y-2">
                {splitList.map((m) => (
                  <div key={m} className="flex items-center gap-2">
                    <span className="flex-1 text-sm">{m}</span>
                    <Input
                      inputMode="decimal"
                      className="w-28 h-9"
                      placeholder="₹0"
                      value={splitAmounts[m] ?? ""}
                      onChange={(e) =>
                        setSplitAmounts({ ...splitAmounts, [m]: e.target.value.replace(/[^0-9.]/g, "") })
                      }
                    />
                  </div>
                ))}
                <div
                  className={cn(
                    "text-xs",
                    Math.abs(splitRemaining) < 0.01 ? "text-fg-muted" : "text-danger font-medium",
                  )}
                >
                  Remaining: {formatINR(splitRemaining)}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Date */}
      <div>
        <label className="text-sm font-medium">Date</label>
        <Input type="date" className="mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {/* Advanced */}
      <button type="button" onClick={() => setAdvanced(!advanced)} className="text-sm text-brand font-medium">
        {advanced ? "Hide" : "Show"} advanced
      </button>
      {advanced && (
        <div>
          <label className="text-sm font-medium">Note</label>
          <Textarea className="mt-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note…" />
        </div>
      )}

      <Button onClick={handleSubmit} disabled={!canSubmit || busy} className="w-full" size="lg">
        {busy ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}
