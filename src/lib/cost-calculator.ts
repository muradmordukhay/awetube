/**
 * Cost calculation engine for AweTube platform.
 *
 * Pure functions with zero external dependencies — fully testable in Vitest.
 * All pricing constants are derived from the Qencode + DigitalOcean cost framework.
 *
 * The engine mirrors the actual transcoding profile from src/lib/qencode/transcoding.ts:
 *   4 quality levels (1080p@5Mbps, 720p@2.5Mbps, 480p@1.2Mbps, 360p@800kbps)
 *   + thumbnail generation
 */

// ─── Constants ───────────────────────────────────────────────────────────────

export const COST_CONSTANTS = {
  // Transcoding: Qencode charges ~$0.005 per minute per quality level
  TRANSCODE_RATE_PER_MIN_PER_QUALITY: 0.005,
  QUALITY_LEVELS: 4,

  // Storage: Qencode S3 at ~$0.006 per GB per month
  STORAGE_RATE_PER_GB_MONTH: 0.006,

  // Storage multiplier: a 10-minute video produces ~4.3 GB across all qualities
  // That's 0.43 GB per minute of source video
  STORAGE_GB_PER_MINUTE: 0.43,

  // CDN: Qencode CDN at ~$0.017 per GB delivered
  CDN_RATE_PER_GB: 0.017,

  // Default quality mix for CDN estimation (what viewers typically watch)
  DEFAULT_QUALITY_MIX: {
    "1080p": { bitrateMbps: 5.0, weight: 0.25 },
    "720p": { bitrateMbps: 2.5, weight: 0.5 },
    "480p": { bitrateMbps: 1.2, weight: 0.15 },
    "360p": { bitrateMbps: 0.8, weight: 0.1 },
  } as Record<string, { bitrateMbps: number; weight: number }>,

  // Average fraction of video watched per view (70%)
  WATCH_FRACTION: 0.7,

  // Compute costs: DigitalOcean
  COMPUTE_PROD_MONTHLY: 12, // App Platform
  DB_PROD_MONTHLY: 15, // Managed PostgreSQL

  // Auxiliary costs
  DOMAIN_YEARLY: 12,
  EMAIL_MONTHLY: 0, // Resend free tier
} as const;

// Quality labels matching the transcoding profile
export const QUALITY_LABELS = [
  "1080p @ 5 Mbps",
  "720p @ 2.5 Mbps",
  "480p @ 1.2 Mbps",
  "360p @ 800 kbps",
];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlatformStats {
  videoCount: number;
  totalDurationSeconds: number;
  totalViews: number;
  subscriberCount: number;
}

export interface TranscodingBreakdown {
  total: number;
  perMinute: number;
  details: { quality: string; cost: number }[];
}

export interface StorageBreakdown {
  totalGB: number;
  monthlyCost: number;
  perVideoGB: number;
}

export interface CdnBreakdown {
  estimatedMonthlyGB: number;
  monthlyCost: number;
  costPerGB: number;
  weightedBitrateMbps: number;
}

export interface ComputeBreakdown {
  monthlyCost: number;
  appPlatform: number;
  database: number;
}

export interface AuxiliaryBreakdown {
  monthlyCost: number;
  domain: number;
  email: number;
}

export interface CostBreakdown {
  transcoding: TranscodingBreakdown;
  storage: StorageBreakdown;
  cdn: CdnBreakdown;
  compute: ComputeBreakdown;
  auxiliary: AuxiliaryBreakdown;
  totalMonthly: number;
}

export interface UnitEconomics {
  costPerVideo: number;
  costPerMinuteUploaded: number;
  costPerViewingHour: number;
  costPerSubscriber: number;
}

export interface ProjectionInputs {
  uploadsPerMonth: number;
  avgDurationMinutes: number;
  monthlyViewers: number;
  avgViewsPerVideo: number;
  monthsAhead: number;
}

export interface ProjectionResult {
  costs: CostBreakdown;
  unitEconomics: UnitEconomics;
  cumulativeVideos: number;
  cumulativeStorageGB: number;
}

export interface ScalingTier {
  name: string;
  videoCount: number;
  monthlyCost: number;
  breakdown: CostBreakdown;
}

// ─── Pillar Calculators ──────────────────────────────────────────────────────

/**
 * Calculate transcoding cost.
 * Transcoding is a one-time cost incurred at upload time.
 */
export function calculateTranscodingCost(
  totalDurationMinutes: number
): TranscodingBreakdown {
  const perMinute =
    COST_CONSTANTS.TRANSCODE_RATE_PER_MIN_PER_QUALITY *
    COST_CONSTANTS.QUALITY_LEVELS;
  const total = totalDurationMinutes * perMinute;

  const details = QUALITY_LABELS.map((quality) => ({
    quality,
    cost:
      totalDurationMinutes *
      COST_CONSTANTS.TRANSCODE_RATE_PER_MIN_PER_QUALITY,
  }));

  return { total, perMinute, details };
}

/**
 * Calculate storage cost.
 * Storage is a recurring monthly cost that grows with each upload.
 */
export function calculateStorageCost(
  totalDurationMinutes: number,
  videoCount: number
): StorageBreakdown {
  const totalGB = totalDurationMinutes * COST_CONSTANTS.STORAGE_GB_PER_MINUTE;
  const monthlyCost = totalGB * COST_CONSTANTS.STORAGE_RATE_PER_GB_MONTH;
  const perVideoGB = videoCount > 0 ? totalGB / videoCount : 0;
  return { totalGB, monthlyCost, perVideoGB };
}

/**
 * Calculate CDN/delivery cost.
 * Uses weighted average bitrate across the quality mix to estimate GB delivered.
 */
export function calculateCdnCost(
  totalViews: number,
  avgDurationMinutes: number
): CdnBreakdown {
  const mix = COST_CONSTANTS.DEFAULT_QUALITY_MIX;
  const weightedBitrateMbps = Object.values(mix).reduce(
    (sum, q) => sum + q.bitrateMbps * q.weight,
    0
  );

  // Convert: Mbps → GB per minute
  // bitrate (Mbps) × 60 seconds / 8 bits per byte / 1024 MB per GB
  const gbPerViewingMinute = (weightedBitrateMbps * 60) / (8 * 1024);

  const estimatedMonthlyGB =
    totalViews *
    avgDurationMinutes *
    COST_CONSTANTS.WATCH_FRACTION *
    gbPerViewingMinute;

  const monthlyCost = estimatedMonthlyGB * COST_CONSTANTS.CDN_RATE_PER_GB;

  return {
    estimatedMonthlyGB,
    monthlyCost,
    costPerGB: COST_CONSTANTS.CDN_RATE_PER_GB,
    weightedBitrateMbps,
  };
}

/**
 * Calculate compute/infrastructure cost (fixed monthly).
 */
export function calculateComputeCost(): ComputeBreakdown {
  return {
    monthlyCost:
      COST_CONSTANTS.COMPUTE_PROD_MONTHLY + COST_CONSTANTS.DB_PROD_MONTHLY,
    appPlatform: COST_CONSTANTS.COMPUTE_PROD_MONTHLY,
    database: COST_CONSTANTS.DB_PROD_MONTHLY,
  };
}

/**
 * Calculate auxiliary/overhead costs (fixed monthly).
 */
export function calculateAuxiliaryCost(): AuxiliaryBreakdown {
  return {
    monthlyCost:
      COST_CONSTANTS.DOMAIN_YEARLY / 12 + COST_CONSTANTS.EMAIL_MONTHLY,
    domain: COST_CONSTANTS.DOMAIN_YEARLY / 12,
    email: COST_CONSTANTS.EMAIL_MONTHLY,
  };
}

// ─── Composite Calculators ───────────────────────────────────────────────────

/**
 * Calculate full cost breakdown from platform statistics.
 */
export function calculateCosts(stats: PlatformStats): CostBreakdown {
  const totalMinutes = stats.totalDurationSeconds / 60;
  const avgMinutes =
    stats.videoCount > 0 ? totalMinutes / stats.videoCount : 0;

  const transcoding = calculateTranscodingCost(totalMinutes);
  const storage = calculateStorageCost(totalMinutes, stats.videoCount);
  const cdn = calculateCdnCost(stats.totalViews, avgMinutes);
  const compute = calculateComputeCost();
  const auxiliary = calculateAuxiliaryCost();

  const totalMonthly =
    transcoding.total +
    storage.monthlyCost +
    cdn.monthlyCost +
    compute.monthlyCost +
    auxiliary.monthlyCost;

  return { transcoding, storage, cdn, compute, auxiliary, totalMonthly };
}

/**
 * Calculate per-unit economics from stats and costs.
 */
export function calculateUnitEconomics(
  stats: PlatformStats,
  costs: CostBreakdown
): UnitEconomics {
  const totalMinutes = stats.totalDurationSeconds / 60;
  const avgMinutes =
    stats.videoCount > 0 ? totalMinutes / stats.videoCount : 0;

  // Total viewing hours: views × avg duration (in hours) × watch fraction
  const totalViewingHours =
    stats.totalViews > 0
      ? (stats.totalViews * avgMinutes * COST_CONSTANTS.WATCH_FRACTION) / 60
      : 0;

  return {
    costPerVideo:
      stats.videoCount > 0 ? costs.totalMonthly / stats.videoCount : 0,
    costPerMinuteUploaded: totalMinutes > 0 ? costs.transcoding.total / totalMinutes : 0,
    costPerViewingHour:
      totalViewingHours > 0 ? costs.cdn.monthlyCost / totalViewingHours : 0,
    costPerSubscriber:
      stats.subscriberCount > 0
        ? costs.totalMonthly / stats.subscriberCount
        : 0,
  };
}

/**
 * Calculate projected costs from hypothetical inputs.
 */
export function calculateProjection(
  inputs: ProjectionInputs
): ProjectionResult {
  const cumulativeVideos = inputs.uploadsPerMonth * inputs.monthsAhead;
  const totalMinutes = cumulativeVideos * inputs.avgDurationMinutes;
  const monthlyViews = inputs.monthlyViewers * inputs.avgViewsPerVideo;

  const stats: PlatformStats = {
    videoCount: cumulativeVideos,
    totalDurationSeconds: totalMinutes * 60,
    totalViews: monthlyViews,
    subscriberCount: Math.floor(inputs.monthlyViewers * 0.1),
  };

  const costs = calculateCosts(stats);
  const unitEconomics = calculateUnitEconomics(stats, costs);

  return {
    costs,
    unitEconomics,
    cumulativeVideos,
    cumulativeStorageGB:
      totalMinutes * COST_CONSTANTS.STORAGE_GB_PER_MINUTE,
  };
}

/**
 * Get the 4 predefined scaling tiers for comparison.
 */
export function getScalingTiers(): ScalingTier[] {
  const tiers = [
    { name: "Seed", videos: 50, avgDuration: 8, monthlyViews: 5_000 },
    { name: "Growth", videos: 200, avgDuration: 10, monthlyViews: 50_000 },
    { name: "Scale", videos: 1_000, avgDuration: 12, monthlyViews: 500_000 },
    {
      name: "Breakout",
      videos: 5_000,
      avgDuration: 15,
      monthlyViews: 5_000_000,
    },
  ];

  return tiers.map((tier) => {
    const stats: PlatformStats = {
      videoCount: tier.videos,
      totalDurationSeconds: tier.videos * tier.avgDuration * 60,
      totalViews: tier.monthlyViews,
      subscriberCount: Math.floor(tier.monthlyViews * 0.05),
    };
    const breakdown = calculateCosts(stats);
    return {
      name: tier.name,
      videoCount: tier.videos,
      monthlyCost: breakdown.totalMonthly,
      breakdown,
    };
  });
}
