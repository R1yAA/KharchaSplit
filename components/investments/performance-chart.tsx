"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { formatINR } from "@/lib/format";
import type { ValuationRow } from "@/lib/investments";

export function PerformanceChart({
  principal,
  startDate,
  valuations,
}: {
  principal: number;
  startDate: string;
  valuations: ValuationRow[];
}) {
  // Sort ascending; ensure a starting point at start_date with principal value.
  const points = [
    { date: startDate, value: principal },
    ...valuations
      .map((v) => ({ date: v.date, value: Number(v.value) }))
      .sort((a, b) => (a.date < b.date ? -1 : 1)),
  ];
  const labelled = points.map((p) => ({
    label: new Date(p.date).toLocaleString("en-IN", { month: "short", year: "2-digit" }),
    value: p.value,
  }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={labelled} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="brandFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8BAE66" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#8BAE66" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A36" />
          <XAxis dataKey="label" fontSize={11} stroke="#A1A1AA" />
          <YAxis tickFormatter={(v) => `₹${v}`} fontSize={11} stroke="#A1A1AA" width={60} />
          <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ background: "#16161D", border: "1px solid #2A2A36", borderRadius: 8 }} />
          <ReferenceLine y={principal} stroke="#EF4444" strokeDasharray="4 4" label={{ value: "Invested", fill: "#EF4444", fontSize: 11, position: "insideTopRight" }} />
          <Area type="monotone" dataKey="value" stroke="#8BAE66" strokeWidth={2} fill="url(#brandFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
