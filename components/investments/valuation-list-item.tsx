"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR, formatDateShort, formatPnL, formatReturnPct } from "@/lib/format";
import type { ValuationRow } from "@/lib/investments";

export function ValuationListItem({
  v,
  prev,
  onEdit,
  onDelete,
}: {
  v: ValuationRow;
  prev?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const delta = prev !== undefined ? Number(v.value) - prev : null;
  const pct = prev && prev > 0 && delta !== null ? (delta / prev) * 100 : null;
  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium">{formatINR(Number(v.value))}</div>
          <div className="text-xs text-fg-muted mt-0.5">{formatDateShort(v.date)}</div>
        </div>
        {delta !== null && (
          <div className={cn("text-xs text-right", delta >= 0 ? "text-success" : "text-danger")}>
            <div className="font-medium">{formatPnL(delta)}</div>
            {pct !== null && <div>{formatReturnPct(pct)}</div>}
          </div>
        )}
        {(onEdit || onDelete) && (
          <button onClick={() => setOpen(!open)} className="text-fg-dim hover:text-fg" aria-label="actions">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        )}
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
