"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { InvestmentCategoryPicker } from "./investment-category-picker";

export interface InvestmentFormValues {
  name: string;
  category: string;
  principal: number;
  start_date: string;
  note: string;
  is_active: boolean;
}

export function InvestmentForm({
  initial,
  submitLabel = "Save Investment",
  onSubmit,
  allowActiveToggle,
}: {
  initial?: Partial<InvestmentFormValues>;
  submitLabel?: string;
  allowActiveToggle?: boolean;
  onSubmit: (v: InvestmentFormValues) => Promise<void> | void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "mutual-fund");
  const [principal, setPrincipal] = useState(initial?.principal ? String(initial.principal) : "");
  const [start, setStart] = useState(initial?.start_date ?? today);
  const [note, setNote] = useState(initial?.note ?? "");
  const [advanced, setAdvanced] = useState(false);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [busy, setBusy] = useState(false);

  const amt = Number(principal) || 0;
  const canSubmit = name.trim().length > 0 && amt > 0;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        principal: amt,
        start_date: start,
        note: note.trim(),
        is_active: isActive,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-fg-dim text-xs uppercase tracking-wide">Principal</div>
        <div className="mt-1 flex items-baseline justify-center gap-1">
          <span className="text-3xl font-semibold text-fg-dim">₹</span>
          <input
            inputMode="decimal"
            autoFocus
            value={principal}
            onChange={(e) => setPrincipal(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="w-40 bg-transparent text-4xl font-bold text-center focus:outline-none placeholder:text-fg-dim"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Name</label>
        <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Parag Parikh Flexi Cap" maxLength={100} />
      </div>

      <InvestmentCategoryPicker value={category} onChange={setCategory} />

      <div>
        <label className="text-sm font-medium">Start date</label>
        <Input className="mt-1" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
      </div>

      <button type="button" onClick={() => setAdvanced(!advanced)} className="text-sm text-brand font-medium">
        {advanced ? "Hide" : "Show"} advanced
      </button>
      {advanced && (
        <>
          <div>
            <label className="text-sm font-medium">Note</label>
            <Textarea className="mt-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note…" />
          </div>
          {allowActiveToggle && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!isActive} onChange={(e) => setIsActive(!e.target.checked)} />
              Mark as closed/exited
            </label>
          )}
        </>
      )}

      <Button onClick={submit} disabled={!canSubmit || busy} className="w-full" size="lg">
        {busy ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}
