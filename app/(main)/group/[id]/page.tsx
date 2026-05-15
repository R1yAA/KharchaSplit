"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGroup, useDeleteGroup, useUpdateGroup } from "@/hooks/use-groups";
import { useGroupExpenses, useUpsertExpense, useDeleteExpense } from "@/hooks/use-expenses";
import { PageHeader } from "@/components/layout/page-header";
import { Fab } from "@/components/layout/fab";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { GroupForm } from "@/components/groups/group-form";
import { ExpenseListItem } from "@/components/expenses/expense-row";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/dialog";
import { computeBalances, minimizeTransfers } from "@/lib/settlement";
import { formatINR } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { groupExpensesToCsv, downloadCsv } from "@/lib/csv";
import type { ExpenseRow } from "@/lib/supabase/types";

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data: group, isLoading } = useGroup(params.id);
  const { data: expenses } = useGroupExpenses(params.id);
  const upsert = useUpsertExpense();
  const del = useDeleteExpense();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [confirmDelGroup, setConfirmDelGroup] = useState(false);
  const [confirmDelExp, setConfirmDelExp] = useState<string | null>(null);

  const balances = useMemo(
    () => (group && expenses ? computeBalances(expenses, group.members) : []),
    [group, expenses],
  );
  const transfers = useMemo(() => minimizeTransfers(balances), [balances]);

  if (isLoading || !group) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-24" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  const onExport = () => {
    if (!expenses) return;
    downloadCsv(`${group.name.replace(/\s+/g, "_")}_expenses.csv`, groupExpensesToCsv(expenses));
  };

  return (
    <>
      <PageHeader
        title={`${group.icon} ${group.name}`}
        back
        right={
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="rounded-full p-1.5 hover:bg-elevated">
              <MoreVertical className="h-5 w-5" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content sideOffset={6} align="end" className="z-50 min-w-[160px] rounded-xl border bg-surface p-1 shadow-card">
                <DropdownMenu.Item onSelect={() => setEditGroupOpen(true)} className="cursor-pointer rounded-lg px-3 py-2 text-sm outline-none hover:bg-elevated">
                  Edit Group
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={onExport} className="cursor-pointer rounded-lg px-3 py-2 text-sm outline-none hover:bg-elevated">
                  Export CSV
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={() => setConfirmDelGroup(true)}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-danger outline-none hover:bg-red-950/40"
                >
                  Delete Group
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        }
      />

      <div className="p-4 space-y-3">
        {/* Settlement summary */}
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Settlement Summary</div>
          {transfers.length === 0 ? (
            <div className="mt-2 text-sm text-fg-muted">All settled up! 🎉</div>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {transfers.slice(0, 3).map((t, i) => (
                <li key={i}>
                  <span className="font-medium">{t.from}</span> owes <span className="font-medium">{t.to}</span>{" "}
                  <span className="font-semibold text-brand">{formatINR(t.amount)}</span>
                </li>
              ))}
              {transfers.length > 3 && <li className="text-xs text-fg-dim">+{transfers.length - 3} more</li>}
            </ul>
          )}
          <div className="mt-3">
            <Button asChild variant="secondary" size="sm">
              <Link href={`/group/${group.id}/settle`}>Settle Up</Link>
            </Button>
          </div>
        </Card>

        {/* Balance chips */}
        {balances.length > 0 && (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 no-scrollbar">
            {balances.map((b) => (
              <span
                key={b.member}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs border",
                  b.net > 0.01 && "bg-green-950/40 border-green-200 text-green-300",
                  b.net < -0.01 && "bg-red-950/40 border-red-200 text-red-300",
                  Math.abs(b.net) < 0.01 && "bg-elevated border-line text-fg-muted",
                )}
              >
                {b.member}: {b.net > 0 ? "+" : ""}
                {formatINR(b.net)}
              </span>
            ))}
          </div>
        )}

        {/* Expenses */}
        <div className="pt-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-fg-muted mb-2">Expenses</div>
          {(expenses?.length ?? 0) === 0 && (
            <EmptyState emoji="🧾" title="No expenses yet" description="Tap + to add your first expense." />
          )}
          <div className="space-y-2">
            {expenses?.map((e) => (
              <ExpenseListItem
                key={e.id}
                expense={e}
                onEdit={() => setEditing(e)}
                onDelete={() => setConfirmDelExp(e.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <Fab onClick={() => setAddOpen(true)} label="Add expense" />

      {/* Add expense */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent title="Add Expense">
          <ExpenseForm
            members={group.members}
            onSubmit={async (v) => {
              try {
                await upsert.mutateAsync({ ...v, group_id: group.id, is_personal: false });
                toast({ message: "Expense added", tone: "success" });
                setAddOpen(false);
              } catch (e: unknown) {
                toast({ message: e instanceof Error ? e.message : "Couldn't save", tone: "error" });
              }
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Edit expense */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent title="Edit Expense">
          {editing && (
            <ExpenseForm
              members={group.members}
              initial={{
                title: editing.title,
                amount: Number(editing.amount),
                category: editing.category,
                paid_by: editing.paid_by,
                paid_by_members: editing.paid_by_members ?? [],
                paid_by_amounts: (editing.paid_by_amounts ?? []).map(Number),
                split_type: editing.split_type,
                split_members: editing.split_members ?? [],
                split_amounts: (editing.split_amounts ?? []).map(Number),
                date: editing.date,
                note: editing.note ?? "",
              }}
              submitLabel="Save Changes"
              onSubmit={async (v) => {
                try {
                  await upsert.mutateAsync({ ...v, id: editing.id, group_id: group.id, is_personal: false });
                  toast({ message: "Expense updated", tone: "success" });
                  setEditing(null);
                } catch (e: unknown) {
                  toast({ message: e instanceof Error ? e.message : "Couldn't save", tone: "error" });
                }
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Edit group */}
      <Sheet open={editGroupOpen} onOpenChange={setEditGroupOpen}>
        <SheetContent title="Edit Group">
          <GroupForm
            initial={{ name: group.name, icon: group.icon, members: group.members }}
            submitLabel="Save Changes"
            onSubmit={async (v) => {
              try {
                await updateGroup.mutateAsync({ id: group.id, ...v });
                toast({ message: "Group updated", tone: "success" });
                setEditGroupOpen(false);
              } catch (e: unknown) {
                toast({ message: e instanceof Error ? e.message : "Couldn't save", tone: "error" });
              }
            }}
          />
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmDelGroup}
        onOpenChange={setConfirmDelGroup}
        title="Delete this group?"
        description="All expenses in this group will also be deleted."
        confirmText="Delete"
        destructive
        onConfirm={async () => {
          await deleteGroup.mutateAsync(group.id);
          router.replace("/");
        }}
      />

      <ConfirmDialog
        open={!!confirmDelExp}
        onOpenChange={(v) => !v && setConfirmDelExp(null)}
        title="Delete this expense?"
        confirmText="Delete"
        destructive
        onConfirm={async () => {
          if (confirmDelExp) await del.mutateAsync(confirmDelExp);
        }}
      />
    </>
  );
}
