"use client";

import { useMemo, useState } from "react";
import { usePersonalExpenses, useUpsertExpense, useDeleteExpense } from "@/hooks/use-expenses";
import { PageHeader } from "@/components/layout/page-header";
import { Fab } from "@/components/layout/fab";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseListItem } from "@/components/expenses/expense-row";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/dialog";
import { formatINR, relativeDay } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import type { ExpenseRow } from "@/lib/supabase/types";

export default function PersonalPage() {
  const { workspace } = useWorkspace();
  const { data: expenses, isLoading } = usePersonalExpenses();
  const upsert = useUpsertExpense();
  const del = useDeleteExpense();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const { thisMonthTotal, grouped } = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let total = 0;
    const buckets = new Map<string, ExpenseRow[]>();
    for (const e of expenses ?? []) {
      if (e.date.startsWith(ym)) total += Number(e.amount);
      const key = e.date;
      const arr = buckets.get(key) ?? [];
      arr.push(e);
      buckets.set(key, arr);
    }
    const grouped = Array.from(buckets.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
    return { thisMonthTotal: total, grouped };
  }, [expenses]);

  return (
    <>
      <PageHeader title="Personal Expenses" />
      <div className="p-4 space-y-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-fg-muted">This Month</div>
          <div className="mt-1 text-2xl font-bold">{formatINR(thisMonthTotal)}</div>
        </Card>

        {isLoading && <Skeleton className="h-20" />}
        {!isLoading && (expenses?.length ?? 0) === 0 && (
          <EmptyState emoji="📝" title="No personal expenses yet" description="Tap + to log your first one." />
        )}
        {grouped.map(([day, items]) => (
          <section key={day}>
            <div className="text-xs font-semibold uppercase tracking-wide text-fg-muted mb-2">{relativeDay(day)}</div>
            <div className="space-y-2">
              {items.map((e) => (
                <ExpenseListItem
                  key={e.id}
                  expense={e}
                  showSplit={false}
                  onEdit={() => setEditing(e)}
                  onDelete={() => setConfirmDel(e.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <Fab onClick={() => setOpen(true)} label="Add personal expense" />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent title="Add Personal Expense">
          <ExpenseForm
            isPersonal
            members={[workspace ?? "Me"]}
            onSubmit={async (v) => {
              try {
                await upsert.mutateAsync({ ...v, group_id: null, is_personal: true });
                toast({ message: "Expense added", tone: "success" });
                setOpen(false);
              } catch (e: unknown) {
                toast({ message: e instanceof Error ? e.message : "Couldn't save", tone: "error" });
              }
            }}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent title="Edit Personal Expense">
          {editing && (
            <ExpenseForm
              isPersonal
              members={[workspace ?? "Me"]}
              initial={{
                title: editing.title,
                amount: Number(editing.amount),
                category: editing.category,
                date: editing.date,
                note: editing.note ?? "",
                split_type: "equal",
              }}
              submitLabel="Save Changes"
              onSubmit={async (v) => {
                await upsert.mutateAsync({ ...v, id: editing.id, group_id: null, is_personal: true });
                toast({ message: "Expense updated", tone: "success" });
                setEditing(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Delete this expense?"
        confirmText="Delete"
        destructive
        onConfirm={async () => {
          if (confirmDel) await del.mutateAsync(confirmDel);
        }}
      />
    </>
  );
}
