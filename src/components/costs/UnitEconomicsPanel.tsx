"use client";

import { formatCurrency } from "@/lib/format";
import type { UnitEconomics } from "@/lib/cost-calculator";

interface UnitEconomicsPanelProps {
  unitEconomics: UnitEconomics;
}

const metrics = [
  {
    key: "costPerVideo",
    label: "Cost per video",
    description: "Total monthly cost divided by number of videos",
  },
  {
    key: "costPerMinuteUploaded",
    label: "Cost per minute uploaded",
    description: "Transcoding cost per minute of source content",
  },
  {
    key: "costPerViewingHour",
    label: "Cost per viewing hour",
    description: "CDN delivery cost per hour of content watched",
  },
  {
    key: "costPerSubscriber",
    label: "Cost per subscriber",
    description: "Total monthly cost divided by subscribers",
  },
] as const;

export default function UnitEconomicsPanel({
  unitEconomics,
}: UnitEconomicsPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Unit Economics</h3>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">
                Metric
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr key={metric.key} className="border-b last:border-b-0">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm font-semibold">
                  {formatCurrency(
                    unitEconomics[metric.key as keyof UnitEconomics],
                    4
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
