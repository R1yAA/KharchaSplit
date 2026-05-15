"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { categoryById } from "@/lib/categories";
import { formatINR, formatDateShort } from "@/lib/format";
import type { ExpenseRow as ExpenseRowT } from "@/lib/supabase/types";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExpenseListItem({
  expense,
  onEdit,
  onDelete,
  showSplit = true,
}: {
  expense: ExpenseRowT;
  onEdit?: () => void;
  onDelete?: () => void;
  showSplit?: boolean;
}) {
  const cat = categoryById(expense.category);
  const [open, setOpen] = useState(false);
  const payer =
    expense.paid_by_members && expense.paid_by_members.length > 1
      ? `${expense.paid_by_members.length} payers`
      : expense.paid_by ?? expense.paid_by_members?.[0] ?? "";

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-elevated text-xl">{cat.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-medium truncate">{expense.title}</span>
          </div>
          <div className="text-xs text-fg-muted truncate">
            {payer && <>Paid by {payer} · </>}
            <span>{formatDateShort(expense.date)}</span>
            {showSplit && expense.split_members && expense.split_members.length > 0 && (
              <> · Split: {expense.split_members.join(", ")}</>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold">{formatINR(Number(expense.amount))}</div>
          {(onEdit || onDelete) && (
            <button onClick={() => setOpen(!open)} className="text-fg-dim hover:text-fg-muted" aria-label="actions">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      <div className={cn("grid grid-cols-2 gap-2 overflow-hidden transition-all", open ? "mt-3 max-h-20" : "max-h-0")}>
        {onEdit && (
          <button onClick={onEdit} className="h-9 rounded-xl bg-blue-950/40 text-blue-300 text-sm inline-flex items-center justify-center gap-1">
            <Pencil className="h-4 w-4" /> Edit
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="h-9 rounded-xl bg-red-950/40 text-red-300 text-sm inline-flex items-center justify-center gap-1">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        )}
      </div>
    </Card>
  );
}
