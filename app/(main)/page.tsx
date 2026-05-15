"use client";

import { useMemo, useState } from "react";
import { useGroups, useCreateGroup } from "@/hooks/use-groups";
import { useAllExpenses } from "@/hooks/use-expenses";
import { GroupCard } from "@/components/groups/group-card";
import { Fab } from "@/components/layout/fab";
import { PageHeader } from "@/components/layout/page-header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { GroupForm } from "@/components/groups/group-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

export default function GroupsPage() {
  const { data: groups, isLoading } = useGroups();
  const { data: expenses } = useAllExpenses();
  const createGroup = useCreateGroup();
  const [open, setOpen] = useState(false);
  const toast = useToast();

  const aggregates = useMemo(() => {
    const map = new Map<string, { total: number; last: string | null }>();
    for (const e of expenses ?? []) {
      if (!e.group_id) continue;
      const cur = map.get(e.group_id) ?? { total: 0, last: null };
      cur.total += Number(e.amount);
      if (!cur.last || e.date > cur.last) cur.last = e.date;
      map.set(e.group_id, cur);
    }
    return map;
  }, [expenses]);

  return (
    <>
      <PageHeader title="KharchaSplit" />
      <div className="p-4 space-y-3">
        {isLoading && (
          <>
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </>
        )}
        {!isLoading && (groups?.length ?? 0) === 0 && (
          <EmptyState
            emoji="🐱"
            title="No groups yet"
            description="Tap + to create your first group and start tracking shared expenses."
          />
        )}
        {groups?.map((g) => {
          const agg = aggregates.get(g.id);
          return <GroupCard key={g.id} group={g} total={agg?.total ?? 0} lastDate={agg?.last} />;
        })}
      </div>

      <Fab onClick={() => setOpen(true)} label="New group" />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent title="Create Group">
          <GroupForm
            onSubmit={async (v) => {
              try {
                await createGroup.mutateAsync(v);
                toast({ message: "Group created", tone: "success" });
                setOpen(false);
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : "Couldn't save. Check your connection.";
                toast({ message: msg, tone: "error" });
              }
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
