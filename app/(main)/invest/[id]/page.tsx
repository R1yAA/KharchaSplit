"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useInvestment, useDeleteInvestment, useUpsertInvestment } from "@/hooks/use-investments";
import { useValuations, useUpsertValuation, useDeleteValuation } from "@/hooks/use-valuations";
import { PageHeader } from "@/components/layout/page-header";
import { Fab } from "@/components/layout/fab";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ValuationForm } from "@/components/investments/valuation-form";
import { InvestmentForm } from "@/components/investments/investment-form";
import { ValuationListItem } from "@/components/investments/valuation-list-item";
import { PerformanceChart } from "@/components/investments/performance-chart";
import { investmentCategoryById } from "@/lib/investment-categories";
import { formatINR, formatPnL, formatReturnPct } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { MoreVertical } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ValuationRow } from "@/lib/investments";

export default function InvestmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data: inv, isLoading } = useInvestment(params.id);
  const { data: valuations = [] } = useValuations(params.id);
  const upsertInv = useUpsertInvestment();
  const delInv = useDeleteInvestment();
  const upsertVal = useUpsertValuation();
  const delVal = useDeleteValuation();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ValuationRow | null>(null);
  const [editInv, setEditInv] = useState(false);
  const [confirmDelInv, setConfirmDelInv] = useState(false);
  const [confirmDelVal, setConfirmDelVal] = useState<string | null>(null);

  const sorted = useMemo(() => [...valuations].sort((a, b) => (a.date < b.date ? 1 : -1)), [valuations]);
  const latest = sorted[0];
  const principal = inv ? Number(inv.principal) : 0;
  const current = latest ? Number(latest.value) : principal;
  const pnL = current - principal;
  const pct = principal > 0 ? (pnL / principal) * 100 : 0;
  const positive = pnL >= 0;
  const existingDates = sorted.map((v) => v.date);

  if (isLoading || !inv) {
    return <div className="p-4"><Skeleton className="h-24" /></div>;
  }
  const cat = investmentCategoryById(inv.category);

  return (
    <>
      <PageHeader
        title={`${cat.emoji} ${inv.name}`}
        back
        right={
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="rounded-full p-1.5 hover:bg-elevated">
              <MoreVertical className="h-5 w-5" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content sideOffset={6} align="end" className="z-50 min-w-[160px] rounded-xl border bg-surface p-1 shadow-card">
                <DropdownMenu.Item onSelect={() => setEditInv(true)} className="cursor-pointer rounded-lg px-3 py-2 text-sm outline-none hover:bg-elevated">
                  Edit Investment
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => setConfirmDelInv(true)} className="cursor-pointer rounded-lg px-3 py-2 text-sm text-danger outline-none hover:bg-red-950/40">
                  Delete Investment
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        }
      />

      <div className="p-4 space-y-3">
        {/* Value summary */}
        <Card className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-fg-muted">Principal</div>
              <div className="mt-1 text-base font-semibold">{formatINR(principal)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-fg-muted">Current</div>
              <div className="mt-1 text-2xl font-bold">{formatINR(current)}</div>
            </div>
          </div>
          <div className={cn("mt-3 flex justify-between border-t border-line pt-3 text-sm", positive ? "text-success" : "text-danger")}>
            <div>
              <div className="text-xs uppercase opacity-80">P&amp;L</div>
              <div className="text-lg font-semibold">{formatPnL(pnL)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase opacity-80">Return</div>
              <div className="text-lg font-semibold">{formatReturnPct(pct)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase opacity-80">XIRR</div>
              <div className="text-lg font-semibold text-fg-muted">—</div>
            </div>
          </div>
        </Card>

        {/* Chart */}
        <Card className="p-3">
          <PerformanceChart principal={principal} startDate={inv.start_date} valuations={valuations} />
        </Card>

        {/* History */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-fg-muted mb-2">Valuation History</div>
          {sorted.length === 0 ? (
            <EmptyState emoji="🧾" title="No entries yet" description="Tap + to log a valuation." />
          ) : (
            <div className="space-y-2">
              {sorted.map((v, i) => {
                const prevValue = i < sorted.length - 1 ? Number(sorted[i + 1].value) : undefined;
                return (
                  <ValuationListItem
                    key={v.id}
                    v={v}
                    prev={prevValue}
                    onEdit={() => setEditing(v)}
                    onDelete={() => setConfirmDelVal(v.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Fab onClick={() => setAddOpen(true)} label="Add valuation" />

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent title="Add Valuation">
          <ValuationForm
            existingDates={existingDates}
            onSubmit={async (v) => {
              try {
                await upsertVal.mutateAsync({ investment_id: inv.id, ...v });
                toast({ message: "Valuation saved", tone: "success" });
                setAddOpen(false);
              } catch (e: unknown) {
                toast({ message: e instanceof Error ? e.message : "Couldn't save", tone: "error" });
              }
            }}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent title="Edit Valuation">
          {editing && (
            <ValuationForm
              initial={{ value: Number(editing.value), date: editing.date }}
              existingDates={existingDates.filter((d) => d !== editing.date)}
              submitLabel="Save Changes"
              onSubmit={async (v) => {
                await upsertVal.mutateAsync({ investment_id: inv.id, ...v });
                // If date changed, delete the old entry
                if (v.date !== editing.date) await delVal.mutateAsync(editing.id);
                setEditing(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={editInv} onOpenChange={setEditInv}>
        <SheetContent title="Edit Investment">
          <InvestmentForm
            allowActiveToggle
            initial={{
              name: inv.name,
              category: inv.category,
              principal: Number(inv.principal),
              start_date: inv.start_date,
              note: inv.note ?? "",
              is_active: inv.is_active,
            }}
            submitLabel="Save Changes"
            onSubmit={async (v) => {
              await upsertInv.mutateAsync({ id: inv.id, ...v });
              toast({ message: "Investment updated", tone: "success" });
              setEditInv(false);
            }}
          />
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmDelInv}
        onOpenChange={setConfirmDelInv}
        title="Delete this investment?"
        description="All valuation history will also be deleted."
        confirmText="Delete"
        destructive
        onConfirm={async () => {
          await delInv.mutateAsync(inv.id);
          router.replace("/invest");
        }}
      />
      <ConfirmDialog
        open={!!confirmDelVal}
        onOpenChange={(v) => !v && setConfirmDelVal(null)}
        title="Delete this valuation?"
        confirmText="Delete"
        destructive
        onConfirm={async () => {
          if (confirmDelVal) await delVal.mutateAsync(confirmDelVal);
        }}
      />
    </>
  );
}
