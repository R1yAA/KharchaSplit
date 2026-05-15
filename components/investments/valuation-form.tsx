"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ValuationFormValues {
  value: number;
  date: string;
}

export function ValuationForm({
  initial,
  existingDates,
  submitLabel = "Save Valuation",
  onSubmit,
}: {
  initial?: Partial<ValuationFormValues>;
  existingDates?: string[];
  submitLabel?: string;
  onSubmit: (v: ValuationFormValues) => Promise<void> | void;
}) {
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const [value, setValue] = useState(initial?.value ? String(initial.value) : "");
  const [date, setDate] = useState(initial?.date ?? firstOfMonth);
  const [busy, setBusy] = useState(false);

  const amt = Number(value);
  const canSubmit = !Number.isNaN(amt) && amt >= 0 && !!date;
  const wouldReplace = existingDates?.includes(date);

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await onSubmit({ value: amt, date });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-fg-dim text-xs uppercase tracking-wide">Current value</div>
        <div className="mt-1 flex items-baseline justify-center gap-1">
          <span className="text-3xl font-semibold text-fg-dim">₹</span>
          <input
            inputMode="decimal"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="w-40 bg-transparent text-4xl font-bold text-center focus:outline-none placeholder:text-fg-dim"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Date</label>
        <Input className="mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {wouldReplace && (
        <div className="rounded-xl bg-red-950/40 text-red-300 text-xs p-3 border border-red-900/40">
          Entry for this date exists — saving will replace it.
        </div>
      )}

      <Button onClick={submit} disabled={!canSubmit || busy} className="w-full" size="lg">
        {busy ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}
