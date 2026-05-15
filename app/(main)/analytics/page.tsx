"use client";

import { useMemo, useState } from "react";
import { useAllExpenses } from "@/hooks/use-expenses";
import { useGroups } from "@/hooks/use-groups";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { categoryById } from "@/lib/categories";
import { formatINR } from "@/lib/format";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#8BAE66", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#94A3B8"];

type Period = "week" | "month" | "3m" | "year" | "all";
type Scope = "all" | "personal" | string; // group id

function startOfPeriod(period: Period): Date | null {
  const now = new Date();
  const d = new Date(now);
  switch (period) {
    case "week":
      d.setDate(now.getDate() - 7);
      return d;
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "3m":
      d.setMonth(now.getMonth() - 3);
      return d;
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    case "all":
    default:
      return null;
  }
}

export default function AnalyticsPage() {
  const { data: expenses } = useAllExpenses();
  const { data: groups } = useGroups();
  const [period, setPeriod] = useState<Period>("month");
  const [scope, setScope] = useState<Scope>("all");

  const filtered = useMemo(() => {
    const since = startOfPeriod(period);
    return (expenses ?? []).filter((e) => {
      if (since && new Date(e.date) < since) return false;
      if (scope === "all") return true;
      if (scope === "personal") return e.is_personal;
      return e.group_id === scope;
    });
  }, [expenses, period, scope]);

  // Chart 1: Category Donut
  const catData = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of filtered) m.set(e.category, (m.get(e.category) ?? 0) + Number(e.amount));
    return Array.from(m.entries()).map(([id, value]) => ({
      id,
      name: `${categoryById(id).emoji} ${categoryById(id).name}`,
      value,
    }));
  }, [filtered]);

  // Chart 2: Group Comparison
  const groupCompare = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of expenses ?? []) {
      const since = startOfPeriod(period);
      if (since && new Date(e.date) < since) continue;
      const key = e.is_personal ? "Personal" : groups?.find((g) => g.id === e.group_id)?.name ?? "Unknown";
      m.set(key, (m.get(key) ?? 0) + Number(e.amount));
    }
    return Array.from(m.entries()).map(([name, total]) => ({ name, total }));
  }, [expenses, groups, period]);

  // Chart 3: Per Person (only when a group is selected)
  const perPerson = useMemo(() => {
    if (scope === "all" || scope === "personal") return [];
    const g = groups?.find((x) => x.id === scope);
    if (!g) return [];
    const m = new Map<string, number>(g.members.map((mm) => [mm, 0]));
    for (const e of filtered) {
      if (e.paid_by_members && e.paid_by_members.length && e.paid_by_amounts) {
        e.paid_by_members.forEach((p, i) => m.set(p, (m.get(p) ?? 0) + Number(e.paid_by_amounts![i])));
      } else if (e.paid_by) {
        m.set(e.paid_by, (m.get(e.paid_by) ?? 0) + Number(e.amount));
      }
    }
    return Array.from(m.entries()).map(([name, total]) => ({ name, total }));
  }, [filtered, groups, scope]);

  // Chart 4: Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, label: d.toLocaleString("en-IN", { month: "short" }), total: 0 });
    }
    const byKey = new Map(months.map((m) => [m.key, m]));
    for (const e of expenses ?? []) {
      if (scope === "personal" && !e.is_personal) continue;
      if (scope !== "all" && scope !== "personal" && e.group_id !== scope) continue;
      const k = e.date.slice(0, 7);
      const bucket = byKey.get(k);
      if (bucket) bucket.total += Number(e.amount);
    }
    return months;
  }, [expenses, scope]);

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const hasData = filtered.length > 0;

  return (
    <>
      <PageHeader title="Analytics" />
      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="h-10 flex-1 rounded-xl border border-line bg-surface px-3 text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="h-10 flex-1 rounded-xl border border-line bg-surface px-3 text-sm"
          >
            <option value="all">All</option>
            <option value="personal">Personal Only</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-fg-muted">Total Spend</div>
          <div className="mt-1 text-2xl font-bold">{formatINR(total)}</div>
        </Card>

        {!hasData ? (
          <EmptyState emoji="📊" title="No data for this filter" description="Try a different period or scope." />
        ) : (
          <>
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-2">Category Breakdown</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {catData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatINR(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {catData
                  .sort((a, b) => b.value - a.value)
                  .map((c, i) => (
                    <li key={c.id} className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        {c.name}
                      </span>
                      <span className="font-medium">{formatINR(c.value)}</span>
                    </li>
                  ))}
              </ul>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-2">Group Comparison</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupCompare} layout="vertical" margin={{ left: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `₹${v}`} fontSize={11} />
                    <YAxis dataKey="name" type="category" width={80} fontSize={11} />
                    <Tooltip formatter={(v: number) => formatINR(v)} />
                    <Bar dataKey="total" fill="#8BAE66" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {perPerson.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-2">Per Person Spend</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perPerson}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis tickFormatter={(v) => `₹${v}`} fontSize={11} />
                      <Tooltip formatter={(v: number) => formatINR(v)} />
                      <Bar dataKey="total" fill="#10B981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-2">Monthly Trend</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={11} />
                    <YAxis tickFormatter={(v) => `₹${v}`} fontSize={11} />
                    <Tooltip formatter={(v: number) => formatINR(v)} />
                    <Line type="monotone" dataKey="total" stroke="#8BAE66" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
