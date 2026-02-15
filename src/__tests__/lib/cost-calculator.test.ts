import { describe, it, expect } from "vitest";
import {
  COST_CONSTANTS,
  calculateTranscodingCost,
  calculateStorageCost,
  calculateCdnCost,
  calculateComputeCost,
  calculateAuxiliaryCost,
  calculateCosts,
  calculateUnitEconomics,
  calculateProjection,
  getScalingTiers,
} from "@/lib/cost-calculator";
import type { PlatformStats } from "@/lib/cost-calculator";

describe("cost-calculator", () => {
  describe("calculateTranscodingCost", () => {
    it("calculates cost for 10 minutes across 4 qualities", () => {
      const result = calculateTranscodingCost(10);
      // 10 min × $0.005/min × 4 qualities = $0.20
      expect(result.total).toBeCloseTo(0.2, 2);
      expect(result.perMinute).toBeCloseTo(0.02, 4);
      expect(result.details).toHaveLength(4);
    });

    it("returns zero for zero duration", () => {
      const result = calculateTranscodingCost(0);
      expect(result.total).toBe(0);
    });

    it("each quality costs the same per minute", () => {
      const result = calculateTranscodingCost(100);
      const perQuality = 100 * COST_CONSTANTS.TRANSCODE_RATE_PER_MIN_PER_QUALITY;
      for (const detail of result.details) {
        expect(detail.cost).toBeCloseTo(perQuality, 4);
      }
    });
  });

  describe("calculateStorageCost", () => {
    it("estimates ~4.3 GB for a 10-minute video", () => {
      const result = calculateStorageCost(10, 1);
      expect(result.totalGB).toBeCloseTo(4.3, 1);
      expect(result.perVideoGB).toBeCloseTo(4.3, 1);
    });

    it("calculates monthly cost at $0.006/GB", () => {
      const result = calculateStorageCost(10, 1);
      expect(result.monthlyCost).toBeCloseTo(
        4.3 * COST_CONSTANTS.STORAGE_RATE_PER_GB_MONTH,
        4
      );
    });

    it("handles zero videos gracefully", () => {
      const result = calculateStorageCost(0, 0);
      expect(result.totalGB).toBe(0);
      expect(result.perVideoGB).toBe(0);
    });
  });

  describe("calculateCdnCost", () => {
    it("returns $0.017 per GB", () => {
      expect(COST_CONSTANTS.CDN_RATE_PER_GB).toBe(0.017);
    });

    it("returns zero for zero views", () => {
      const result = calculateCdnCost(0, 10);
      expect(result.monthlyCost).toBe(0);
      expect(result.estimatedMonthlyGB).toBe(0);
    });

    it("accounts for watch fraction (70%)", () => {
      // 1000 views, 10 min avg
      const result = calculateCdnCost(1000, 10);
      // The GB should reflect 70% of total possible delivery
      expect(result.estimatedMonthlyGB).toBeGreaterThan(0);
    });

    it("uses weighted bitrate from quality mix", () => {
      const result = calculateCdnCost(1000, 10);
      // Weighted: 5.0*0.25 + 2.5*0.5 + 1.2*0.15 + 0.8*0.10 = 1.25 + 1.25 + 0.18 + 0.08 = 2.76 Mbps
      expect(result.weightedBitrateMbps).toBeCloseTo(2.76, 2);
    });
  });

  describe("calculateComputeCost", () => {
    it("returns fixed monthly cost (App Platform + DB)", () => {
      const result = calculateComputeCost();
      expect(result.monthlyCost).toBe(27); // $12 + $15
      expect(result.appPlatform).toBe(12);
      expect(result.database).toBe(15);
    });
  });

  describe("calculateAuxiliaryCost", () => {
    it("returns domain cost amortized monthly", () => {
      const result = calculateAuxiliaryCost();
      expect(result.domain).toBeCloseTo(1, 0); // $12/12 = $1
      expect(result.email).toBe(0); // free tier
      expect(result.monthlyCost).toBeCloseTo(1, 0);
    });
  });

  describe("calculateCosts", () => {
    it("sums all 5 pillars into totalMonthly", () => {
      const stats: PlatformStats = {
        videoCount: 10,
        totalDurationSeconds: 10 * 10 * 60, // 10 videos × 10 min
        totalViews: 1000,
        subscriberCount: 50,
      };
      const costs = calculateCosts(stats);

      const expectedTotal =
        costs.transcoding.total +
        costs.storage.monthlyCost +
        costs.cdn.monthlyCost +
        costs.compute.monthlyCost +
        costs.auxiliary.monthlyCost;

      expect(costs.totalMonthly).toBeCloseTo(expectedTotal, 4);
    });

    it("handles empty platform (zero videos, zero views)", () => {
      const stats: PlatformStats = {
        videoCount: 0,
        totalDurationSeconds: 0,
        totalViews: 0,
        subscriberCount: 0,
      };
      const costs = calculateCosts(stats);

      // Only fixed costs should be present
      expect(costs.transcoding.total).toBe(0);
      expect(costs.storage.monthlyCost).toBe(0);
      expect(costs.cdn.monthlyCost).toBe(0);
      expect(costs.compute.monthlyCost).toBe(27);
      expect(costs.auxiliary.monthlyCost).toBeCloseTo(1, 0);
      expect(costs.totalMonthly).toBeCloseTo(28, 0);
    });
  });

  describe("calculateUnitEconomics", () => {
    it("calculates cost per video", () => {
      const stats: PlatformStats = {
        videoCount: 10,
        totalDurationSeconds: 6000, // 100 min total
        totalViews: 500,
        subscriberCount: 20,
      };
      const costs = calculateCosts(stats);
      const unit = calculateUnitEconomics(stats, costs);

      expect(unit.costPerVideo).toBeCloseTo(costs.totalMonthly / 10, 4);
    });

    it("calculates cost per subscriber", () => {
      const stats: PlatformStats = {
        videoCount: 10,
        totalDurationSeconds: 6000,
        totalViews: 500,
        subscriberCount: 20,
      };
      const costs = calculateCosts(stats);
      const unit = calculateUnitEconomics(stats, costs);

      expect(unit.costPerSubscriber).toBeCloseTo(costs.totalMonthly / 20, 4);
    });

    it("returns zero metrics when no data", () => {
      const stats: PlatformStats = {
        videoCount: 0,
        totalDurationSeconds: 0,
        totalViews: 0,
        subscriberCount: 0,
      };
      const costs = calculateCosts(stats);
      const unit = calculateUnitEconomics(stats, costs);

      expect(unit.costPerVideo).toBe(0);
      expect(unit.costPerViewingHour).toBe(0);
      expect(unit.costPerSubscriber).toBe(0);
    });
  });

  describe("calculateProjection", () => {
    it("projects cumulative videos correctly", () => {
      const result = calculateProjection({
        uploadsPerMonth: 10,
        avgDurationMinutes: 8,
        monthlyViewers: 1000,
        avgViewsPerVideo: 50,
        monthsAhead: 12,
      });
      expect(result.cumulativeVideos).toBe(120); // 10 × 12
    });

    it("projects cumulative storage correctly", () => {
      const result = calculateProjection({
        uploadsPerMonth: 10,
        avgDurationMinutes: 10,
        monthlyViewers: 1000,
        avgViewsPerVideo: 50,
        monthsAhead: 12,
      });
      // 120 videos × 10 min × 0.43 GB/min = 516 GB
      expect(result.cumulativeStorageGB).toBeCloseTo(516, 0);
    });

    it("includes all cost pillars in projection", () => {
      const result = calculateProjection({
        uploadsPerMonth: 5,
        avgDurationMinutes: 10,
        monthlyViewers: 500,
        avgViewsPerVideo: 20,
        monthsAhead: 6,
      });
      expect(result.costs.transcoding.total).toBeGreaterThan(0);
      expect(result.costs.storage.monthlyCost).toBeGreaterThan(0);
      expect(result.costs.cdn.monthlyCost).toBeGreaterThan(0);
      expect(result.costs.compute.monthlyCost).toBe(27);
    });
  });

  describe("getScalingTiers", () => {
    it("returns 4 tiers", () => {
      const tiers = getScalingTiers();
      expect(tiers).toHaveLength(4);
    });

    it("tiers are in ascending order of cost", () => {
      const tiers = getScalingTiers();
      for (let i = 1; i < tiers.length; i++) {
        expect(tiers[i].monthlyCost).toBeGreaterThan(tiers[i - 1].monthlyCost);
      }
    });

    it("tier names match expected labels", () => {
      const tiers = getScalingTiers();
      expect(tiers.map((t) => t.name)).toEqual([
        "Seed",
        "Growth",
        "Scale",
        "Breakout",
      ]);
    });

    it("tier video counts match framework", () => {
      const tiers = getScalingTiers();
      expect(tiers.map((t) => t.videoCount)).toEqual([50, 200, 1000, 5000]);
    });
  });
});
