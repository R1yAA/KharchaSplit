"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useGroup } from "@/hooks/use-groups";
import { useGroupExpenses } from "@/hooks/use-expenses";
import { useSettlements, useMarkSettlementPaid } from "@/hooks/use-settlements";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { computeBalances, minimizeTransfers } from "@/lib/settlement";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export default function SettlePage() {
  const params = useParams<{ id: string }>();
  const { data: group } = useGroup(params.id);
  const { data: expenses } = useGroupExpenses(params.id);
  const { data: paidMarks } = useSettlements(params.id);
  const mark = useMarkSettlementPaid();

  const balances = useMemo(
    () => (group && expenses ? computeBalances(expenses, group.members) : []),
    [group, expenses],
  );
  const transfers = useMemo(() => minimizeTransfers(balances), [balances]);
  const total = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const maxAbs = Math.max(1, ...balances.map((b) => Math.abs(b.net)));

  const paidKey = (from: string, to: string) => `${from}→${to}`;
  const paidSet = new Set((paidMarks ?? []).filter((s) => s.is_paid).map((s) => paidKey(s.from_member, s.to_member)));

  if (!group) return <div className="p-4"><Skeleton className="h-24" /></div>;

  return (
    <>
      <PageHeader title="Settle Up" back />
      <div className="p-4 space-y-4">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-fg-muted">Total Group Spend</div>
          <div className="mt-1 text-2xl font-bold">{formatINR(total)}</div>
        </Card>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-fg-muted mb-2">Individual Balances</h2>
          <Card className="divide-y">
            {balances.map((b) => {
              const pct = (Math.abs(b.net) / maxAbs) * 100;
              const positive = b.net >= 0;
              return (
                <div key={b.member} className="p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{b.member}</span>
                    <span className={cn(positive ? "text-success" : "text-danger", "font-semibold")}>
                      {positive ? "+" : ""}
                      {formatINR(b.net)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-elevated rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", positive ? "bg-success" : "bg-danger")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </Card>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-fg-muted mb-2">Suggested Transfers</h2>
          {transfers.length === 0 && (
            <Card className="p-4 text-sm text-fg-muted text-center">All settled up! 🎉</Card>
          )}
          <div className="space-y-2">
            {transfers.map((t, i) => {
              const isPaid = paidSet.has(paidKey(t.from, t.to));
              return (
                <Card key={i} className={cn("p-3 flex items-center justify-between gap-2", isPaid && "opacity-50")}>
                  <div className="text-sm">
                    <span className="font-medium">{t.from}</span> → <span className="font-medium">{t.to}</span>
                    <div className="font-semibold text-brand mt-0.5">{formatINR(t.amount)}</div>
                  </div>
                  <button
                    onClick={() =>
                      mark.mutate({ groupId: group.id, from: t.from, to: t.to, amount: t.amount, paid: !isPaid })
                    }
                    className={cn(
                      "inline-flex items-center gap-1 rounded-xl px-3 h-9 text-sm border",
                      isPaid ? "bg-success text-white border-success" : "bg-surface text-fg-muted border-line",
                    )}
                  >
                    <Check className="h-4 w-4" />
                    {isPaid ? "Paid" : "Mark Paid"}
                  </button>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
