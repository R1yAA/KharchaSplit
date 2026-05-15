"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { DEFAULT_INVESTMENT_CATEGORIES } from "@/lib/investment-categories";
import { useCustomInvestmentCategories } from "@/hooks/use-custom-investment-categories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function InvestmentCategoryPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { list, add, remove } = useCustomInvestmentCategories();
  const [adding, setAdding] = useState(false);
  const [emoji, setEmoji] = useState("");
  const [name, setName] = useState("");

  const submit = () => {
    const id = add(emoji, name);
    if (id) {
      onChange(id);
      setEmoji("");
      setName("");
      setAdding(false);
    }
  };

  const all = [...DEFAULT_INVESTMENT_CATEGORIES, ...list];

  return (
    <div>
      <label className="text-sm font-medium">Category</label>
      <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto px-1 no-scrollbar">
        {all.map((c) => {
          const isCustom = c.id.startsWith("custom-inv-");
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1 rounded-full pl-3 pr-2 h-9 text-sm border",
                value === c.id ? "bg-brand text-white border-brand" : "bg-surface border-line",
              )}
            >
              <span>{c.emoji}</span>
              <span>{c.name}</span>
              {isCustom && (
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(c.id);
                    if (value === c.id) onChange("other-inv");
                  }}
                  className="ml-1 rounded-full p-0.5 hover:bg-black/20"
                  aria-label={`Remove ${c.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="shrink-0 inline-flex items-center gap-1 rounded-full px-3 h-9 text-sm border border-dashed border-line text-fg-muted"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      {adding && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2">
          <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🧊" maxLength={4} className="h-9 w-14 text-center text-lg" />
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" maxLength={30} className="h-9 flex-1 min-w-[120px]" />
          <Button type="button" size="sm" variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
          <Button type="button" size="sm" onClick={submit} disabled={!emoji.trim() || !name.trim()}>Add</Button>
        </div>
      )}
    </div>
  );
}
