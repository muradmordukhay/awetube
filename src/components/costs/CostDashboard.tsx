"use client";

import { useState, useMemo } from "react";
import { Calculator, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  calculateCosts,
  calculateUnitEconomics,
  calculateProjection,
} from "@/lib/cost-calculator";
import type { PlatformStats, ProjectionInputs } from "@/lib/cost-calculator";

import CostSummaryCards from "./CostSummaryCards";
import CostBreakdownCards from "./CostBreakdownCards";
import UnitEconomicsPanel from "./UnitEconomicsPanel";
import CostDistributionChart from "./CostDistributionChart";
import ProjectionForm from "./ProjectionForm";
import ProjectionResults from "./ProjectionResults";
import ScalingChart from "./ScalingChart";

type Tab = "channel" | "platform" | "projections";

interface CostDashboardProps {
  channelStats: PlatformStats;
  platformStats: PlatformStats;
  hasChannel: boolean;
}

const DEFAULT_PROJECTION: ProjectionInputs = {
  uploadsPerMonth: 10,
  avgDurationMinutes: 8,
  monthlyViewers: 1000,
  avgViewsPerVideo: 50,
  monthsAhead: 12,
};

export default function CostDashboard({
  channelStats,
  platformStats,
  hasChannel,
}: CostDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>(
    hasChannel ? "channel" : "platform"
  );
  const [projectionInputs, setProjectionInputs] =
    useState<ProjectionInputs>(DEFAULT_PROJECTION);

  // Compute costs for channel and platform
  const channelCosts = useMemo(() => calculateCosts(channelStats), [channelStats]);
  const channelUnit = useMemo(
    () => calculateUnitEconomics(channelStats, channelCosts),
    [channelStats, channelCosts]
  );

  const platformCosts = useMemo(() => calculateCosts(platformStats), [platformStats]);
  const platformUnit = useMemo(
    () => calculateUnitEconomics(platformStats, platformCosts),
    [platformStats, platformCosts]
  );

  // Compute projection
  const projection = useMemo(
    () => calculateProjection(projectionInputs),
    [projectionInputs]
  );

  const tabs: { key: Tab; label: string; disabled?: boolean }[] = [
    ...(hasChannel
      ? [{ key: "channel" as Tab, label: "Your Channel" }]
      : []),
    { key: "platform" as Tab, label: "Platform" },
    { key: "projections" as Tab, label: "Projections" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">Cost Calculator</h1>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/studio">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Studio
          </Link>
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "channel" && hasChannel && (
        <div className="space-y-6">
          <CostSummaryCards
            costs={channelCosts}
            unitEconomics={channelUnit}
            totalStorageGB={channelCosts.storage.totalGB}
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CostDistributionChart costs={channelCosts} />
            <UnitEconomicsPanel unitEconomics={channelUnit} />
          </div>
          <CostBreakdownCards costs={channelCosts} />
        </div>
      )}

      {activeTab === "platform" && (
        <div className="space-y-6">
          <CostSummaryCards
            costs={platformCosts}
            unitEconomics={platformUnit}
            totalStorageGB={platformCosts.storage.totalGB}
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CostDistributionChart costs={platformCosts} />
            <UnitEconomicsPanel unitEconomics={platformUnit} />
          </div>
          <CostBreakdownCards costs={platformCosts} />
        </div>
      )}

      {activeTab === "projections" && (
        <div className="space-y-6">
          <ProjectionForm
            inputs={projectionInputs}
            onChange={setProjectionInputs}
          />
          <ProjectionResults projection={projection} />
          <ScalingChart />
        </div>
      )}
    </div>
  );
}
