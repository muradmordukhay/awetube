"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getScalingTiers } from "@/lib/cost-calculator";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function ScalingChart() {
  const tiers = getScalingTiers();

  const data = tiers.map((tier) => ({
    name: tier.name,
    Transcoding: tier.breakdown.transcoding.total,
    Storage: tier.breakdown.storage.monthlyCost,
    CDN: tier.breakdown.cdn.monthlyCost,
    Compute: tier.breakdown.compute.monthlyCost,
    Auxiliary: tier.breakdown.auxiliary.monthlyCost,
    total: tier.monthlyCost,
    videos: tier.videoCount,
  }));

  const pillars = ["Transcoding", "Storage", "CDN", "Compute", "Auxiliary"];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Scaling Tiers</h3>
      <div className="rounded-xl border p-4">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                String(name),
              ]}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload as
                  | Record<string, number>
                  | undefined;
                return item
                  ? `${String(label)} (${formatNumber(item.videos)} videos)`
                  : String(label);
              }}
              contentStyle={{
                backgroundColor: "var(--popover)",
                borderColor: "var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--popover-foreground)",
              }}
            />
            <Legend />
            {pillars.map((pillar, i) => (
              <Bar
                key={pillar}
                dataKey={pillar}
                stackId="cost"
                fill={CHART_COLORS[i]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tier summary table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Tier</th>
              <th className="px-4 py-3 text-right text-sm font-medium">
                Videos
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium">
                Monthly Cost
              </th>
              <th className="hidden px-4 py-3 text-right text-sm font-medium sm:table-cell">
                Cost / Video
              </th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => (
              <tr key={tier.name} className="border-b last:border-b-0">
                <td className="px-4 py-3 text-sm font-medium">{tier.name}</td>
                <td className="px-4 py-3 text-right text-sm font-mono">
                  {formatNumber(tier.videoCount)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-mono font-semibold">
                  {formatCurrency(tier.monthlyCost)}
                </td>
                <td className="hidden px-4 py-3 text-right text-sm font-mono sm:table-cell">
                  {formatCurrency(tier.monthlyCost / tier.videoCount, 3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
