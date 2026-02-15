"use client";

import { formatCurrency, formatGB, formatNumber } from "@/lib/format";
import CostBreakdownCards from "./CostBreakdownCards";
import UnitEconomicsPanel from "./UnitEconomicsPanel";
import type { ProjectionResult } from "@/lib/cost-calculator";

interface ProjectionResultsProps {
  projection: ProjectionResult;
}

export default function ProjectionResults({
  projection,
}: ProjectionResultsProps) {
  return (
    <div className="space-y-6">
      {/* Projection headline stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Total Videos</p>
          <p className="text-xl font-bold">
            {formatNumber(projection.cumulativeVideos)}
          </p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Cumulative Storage
          </p>
          <p className="text-xl font-bold">
            {formatGB(projection.cumulativeStorageGB)}
          </p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Projected Monthly Cost
          </p>
          <p className="text-xl font-bold">
            {formatCurrency(projection.costs.totalMonthly)}
          </p>
        </div>
      </div>

      <CostBreakdownCards costs={projection.costs} />
      <UnitEconomicsPanel unitEconomics={projection.unitEconomics} />
    </div>
  );
}
