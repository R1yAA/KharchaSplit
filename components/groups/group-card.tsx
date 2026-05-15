"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatINR, relativeDay } from "@/lib/format";
import type { GroupRow } from "@/lib/supabase/types";

export function GroupCard({ group, total, lastDate }: { group: GroupRow; total: number; lastDate?: string | null }) {
  return (
    <Link href={`/group/${group.id}`} className="block">
      <Card className="p-4 active:scale-[0.99] transition">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-900/30 text-2xl">{group.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{group.name}</div>
            <div className="text-xs text-fg-muted mt-0.5">
              {group.members.length} {group.members.length === 1 ? "member" : "members"} · {formatINR(total)}
            </div>
            {lastDate && <div className="text-xs text-fg-dim mt-0.5">Last activity: {relativeDay(lastDate)}</div>}
          </div>
        </div>
      </Card>
    </Link>
  );
}
