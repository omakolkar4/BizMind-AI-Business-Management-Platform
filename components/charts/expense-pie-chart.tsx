"use client";

import * as React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ExpensePieChartProps {
  data?: {
    name: string;
    value: number;
    color: string;
  }[];
}

const defaultExpenseData = [
  { name: "Raw Materials & Supply", value: 145000, color: "#4F46E5" },
  { name: "Kitchen Lease & Utilities", value: 90000, color: "#06B6D4" },
  { name: "Staff Payroll", value: 110000, color: "#10B981" },
  { name: "Growth & Marketing", value: 42000, color: "#F59E0B" },
  { name: "Packaging & Logistics", value: 38000, color: "#EC4899" },
];

export function ExpensePieChart({ data = defaultExpenseData }: ExpensePieChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-72 w-full animate-pulse rounded-xl bg-muted/40" />;
  }

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0];
                const percentage = total > 0 ? ((item.value as number) / total) * 100 : 0;
                return (
                  <div className="rounded-xl border bg-card p-3 shadow-xl text-xs space-y-1">
                    <div className="font-bold text-foreground">{item.name}</div>
                    <div className="text-muted-foreground flex items-center justify-between gap-4">
                      <span>Amount:</span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(item.value as number)}
                      </span>
                    </div>
                    <div className="text-muted-foreground flex items-center justify-between gap-4">
                      <span>Share:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            layout="horizontal"
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
