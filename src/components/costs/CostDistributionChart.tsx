"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import type { CostBreakdown } from "@/lib/cost-calculator";

interface CostDistributionChartProps {
  costs: CostBreakdown;
}

// Use Tailwind chart colors mapped to CSS variables via inline styles
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function CostDistributionChart({
  costs,
}: CostDistributionChartProps) {
  const data = [
    { name: "Transcoding", value: costs.transcoding.total },
    { name: "Storage", value: costs.storage.monthlyCost },
    { name: "CDN", value: costs.cdn.monthlyCost },
    { name: "Compute", value: costs.compute.monthlyCost },
    { name: "Auxiliary", value: costs.auxiliary.monthlyCost },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Cost Distribution</h3>
        <div className="flex h-64 items-center justify-center rounded-xl border">
          <p className="text-muted-foreground">No cost data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Cost Distribution</h3>
      <div className="rounded-xl border p-4">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              nameKey="name"
              paddingAngle={2}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: "var(--popover)",
                borderColor: "var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--popover-foreground)",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
