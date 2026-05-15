"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatINR, formatReturnPct, relativeDay } from "@/lib/format";
import { investmentCategoryById } from "@/lib/investment-categories";
import { cn } from "@/lib/utils";
import type { PortfolioRow } from "@/lib/investments";

export function InvestmentCard({ row }: { row: PortfolioRow }) {
  const cat = investmentCategoryById(row.category);
  const positive = row.pnL >= 0;
  return (
    <Link href={`/invest/${row.id}`} className="block">
      <Card className="p-4 active:scale-[0.99] transition">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-elevated text-2xl">{cat.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{row.name}</div>
            <div className="text-xs text-fg-muted mt-0.5">Invested {formatINR(row.principal)}</div>
            {row.lastUpdated && <div className="text-xs text-fg-dim mt-0.5">Updated {relativeDay(row.lastUpdated)}</div>}
          </div>
          <div className="text-right">
            <div className="font-semibold">{formatINR(row.currentValue)}</div>
            <div className={cn("text-xs font-medium mt-0.5", positive ? "text-success" : "text-danger")}>
              {formatReturnPct(row.returnPct)}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
