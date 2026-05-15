"use client";

import { useState } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useUpsertInvestment } from "@/hooks/use-investments";
import { useUpsertValuation } from "@/hooks/use-valuations";
import { PageHeader } from "@/components/layout/page-header";
import { Fab } from "@/components/layout/fab";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { InvestmentForm } from "@/components/investments/investment-form";
import { InvestmentCard } from "@/components/investments/investment-card";
import { PortfolioSummaryCard } from "@/components/investments/portfolio-summary-card";
import { useToast } from "@/components/ui/toast";

export default function InvestPage() {
  const { summary } = usePortfolio();
  const upsert = useUpsertInvestment();
  const upsertVal = useUpsertValuation();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader title="Portfolio" />
      <div className="p-4 space-y-3">
        <PortfolioSummaryCard s={summary} />
        {summary.investments.length === 0 ? (
          <EmptyState emoji="💰" title="No investments yet" description="Start tracking your portfolio." />
        ) : (
          summary.investments.map((row) => <InvestmentCard key={row.id} row={row} />)
        )}
      </div>

      <Fab onClick={() => setOpen(true)} label="Add investment" />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent title="Add Investment">
          <InvestmentForm
            onSubmit={async (v) => {
              try {
                const inv = await upsert.mutateAsync(v);
                // Auto-create first valuation = principal at start_date
                await upsertVal.mutateAsync({ investment_id: inv.id, value: v.principal, date: v.start_date });
                toast({ message: "Investment added", tone: "success" });
                setOpen(false);
              } catch (e: unknown) {
                toast({ message: e instanceof Error ? e.message : "Couldn't save", tone: "error" });
              }
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
