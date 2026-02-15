"use client";

import { useState } from "react";
import {
  Cpu,
  HardDrive,
  Globe,
  Server,
  Wrench,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatGB } from "@/lib/format";
import type { CostBreakdown } from "@/lib/cost-calculator";

interface CostBreakdownCardsProps {
  costs: CostBreakdown;
}

interface LineItem {
  label: string;
  value: string;
}

interface PillarConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  getCost: (c: CostBreakdown) => number;
  costLabel: string;
  getItems: (c: CostBreakdown) => LineItem[];
}

const pillars: PillarConfig[] = [
  {
    key: "transcoding",
    label: "Transcoding",
    icon: Cpu,
    getCost: (c) => c.transcoding.total,
    costLabel: "one-time",
    getItems: (c) => [
      ...c.transcoding.details.map((d) => ({
        label: d.quality,
        value: formatCurrency(d.cost),
      })),
      {
        label: "Rate per minute (all qualities)",
        value: `${formatCurrency(c.transcoding.perMinute, 3)}/min`,
      },
    ],
  },
  {
    key: "storage",
    label: "Storage",
    icon: HardDrive,
    getCost: (c) => c.storage.monthlyCost,
    costLabel: "/month",
    getItems: (c) => [
      { label: "Total stored", value: formatGB(c.storage.totalGB) },
      { label: "Per video avg", value: formatGB(c.storage.perVideoGB) },
      { label: "Rate", value: "$0.006/GB/month" },
    ],
  },
  {
    key: "cdn",
    label: "CDN / Delivery",
    icon: Globe,
    getCost: (c) => c.cdn.monthlyCost,
    costLabel: "/month",
    getItems: (c) => [
      {
        label: "Estimated monthly delivery",
        value: formatGB(c.cdn.estimatedMonthlyGB),
      },
      {
        label: "Weighted bitrate",
        value: `${c.cdn.weightedBitrateMbps.toFixed(2)} Mbps`,
      },
      { label: "Rate", value: `${formatCurrency(c.cdn.costPerGB, 3)}/GB` },
    ],
  },
  {
    key: "compute",
    label: "Compute",
    icon: Server,
    getCost: (c) => c.compute.monthlyCost,
    costLabel: "/month (fixed)",
    getItems: (c) => [
      {
        label: "App Platform (DO)",
        value: formatCurrency(c.compute.appPlatform),
      },
      {
        label: "Managed PostgreSQL (DO)",
        value: formatCurrency(c.compute.database),
      },
    ],
  },
  {
    key: "auxiliary",
    label: "Auxiliary",
    icon: Wrench,
    getCost: (c) => c.auxiliary.monthlyCost,
    costLabel: "/month (fixed)",
    getItems: (c) => [
      { label: "Domain (amortized)", value: formatCurrency(c.auxiliary.domain) },
      { label: "Email (Resend free tier)", value: formatCurrency(c.auxiliary.email) },
    ],
  },
];

export default function CostBreakdownCards({ costs }: CostBreakdownCardsProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Cost Breakdown by Pillar</h3>
      {pillars.map((pillar) => {
        const isOpen = expanded[pillar.key] ?? false;
        const items = pillar.getItems(costs);

        return (
          <div key={pillar.key} className="rounded-xl border">
            <button
              onClick={() => toggle(pillar.key)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3">
                <pillar.icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{pillar.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {pillar.costLabel}
                </span>
                <span className="font-semibold">
                  {formatCurrency(pillar.getCost(costs))}
                </span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>
            {isOpen && (
              <div className="border-t px-4 py-3 space-y-2">
                {items.map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
