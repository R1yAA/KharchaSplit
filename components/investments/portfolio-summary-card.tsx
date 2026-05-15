"use client";

import { Card } from "@/components/ui/card";
import { formatINR, formatPnL, formatReturnPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PortfolioSummary } from "@/lib/investments";

export function PortfolioSummaryCard({ s }: { s: PortfolioSummary }) {
  const positive = s.totalPnL >= 0;
  return (
    <Card className="p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-fg-muted">Invested</div>
          <div className="mt-1 text-lg font-semibold">{formatINR(s.totalInvested)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-fg-muted">Current Value</div>
          <div className="mt-1 text-lg font-semibold">{formatINR(s.currentValue)}</div>
        </div>
      </div>
      <div className={cn("mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-3", positive ? "text-success" : "text-danger")}>
        <div>
          <div className="text-xs uppercase tracking-wide opacity-80">Overall P&amp;L</div>
          <div className="mt-1 text-2xl font-bold">{formatPnL(s.totalPnL)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide opacity-80">Return</div>
          <div className="mt-1 text-lg font-semibold">{formatReturnPct(s.totalReturnPct)}</div>
        </div>
      </div>
    </Card>
  );
}
