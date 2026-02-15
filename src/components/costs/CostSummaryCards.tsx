"use client";

import { DollarSign, HardDrive, Tv, TrendingUp } from "lucide-react";
import { formatCurrency, formatGB, formatNumber } from "@/lib/format";
import type { CostBreakdown, UnitEconomics } from "@/lib/cost-calculator";

interface CostSummaryCardsProps {
  costs: CostBreakdown;
  unitEconomics: UnitEconomics;
  totalStorageGB: number;
}

const cards = [
  {
    key: "monthly",
    label: "Monthly Total",
    icon: DollarSign,
    getValue: (p: CostSummaryCardsProps) => formatCurrency(p.costs.totalMonthly),
  },
  {
    key: "perVideo",
    label: "Cost / Video",
    icon: TrendingUp,
    getValue: (p: CostSummaryCardsProps) => formatCurrency(p.unitEconomics.costPerVideo),
  },
  {
    key: "storage",
    label: "Storage Used",
    icon: HardDrive,
    getValue: (p: CostSummaryCardsProps) => formatGB(p.totalStorageGB),
  },
  {
    key: "cdn",
    label: "CDN Delivery / mo",
    icon: Tv,
    getValue: (p: CostSummaryCardsProps) =>
      `${formatGB(p.costs.cdn.estimatedMonthlyGB)} (${formatNumber(p.costs.cdn.estimatedMonthlyGB)} views)`,
  },
] as const;

export default function CostSummaryCards(props: CostSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.key} className="rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <card.icon className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{card.getValue(props)}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
