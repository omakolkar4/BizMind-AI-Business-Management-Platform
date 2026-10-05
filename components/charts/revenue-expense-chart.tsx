"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface RevenueExpenseChartProps {
  data?: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
}

const defaultMonthlyData = [
  { month: "May", revenue: 420000, expenses: 280000, profit: 140000 },
  { month: "Jun", revenue: 510000, expenses: 310000, profit: 200000 },
  { month: "Jul", revenue: 630000, expenses: 340000, profit: 290000 },
  { month: "Aug", revenue: 740000, expenses: 390000, profit: 350000 },
  { month: "Sep", revenue: 845000, expenses: 425000, profit: 420000 },
  { month: "Oct (Proj)", revenue: 950000, expenses: 460000, profit: 490000 },
];

export function RevenueExpenseChart({ data = defaultMonthlyData }: RevenueExpenseChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-72 w-full animate-pulse rounded-xl bg-muted/40" />;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          barGap={6}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(val) => `₹${val / 1000}k`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-xl border bg-card p-3 shadow-xl text-xs space-y-1.5">
                    <div className="font-bold text-foreground border-b pb-1">
                      {label} Financials
                    </div>
                    {payload.map((entry: any, index: number) => (
                      <div
                        key={`item-${index}`}
                        className="flex items-center justify-between gap-4"
                      >
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          {entry.name}:
                        </span>
                        <span className="font-bold text-foreground">
                          {formatCurrency(entry.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
          />
          <Bar
            name="Revenue"
            dataKey="revenue"
            fill="#4F46E5"
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            name="Expenses"
            dataKey="expenses"
            fill="#F43F5E"
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
