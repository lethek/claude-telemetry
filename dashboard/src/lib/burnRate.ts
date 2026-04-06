import type { UsageSummaryRow } from "./queries";

export interface UsagePace {
  avgDailyCost: number;
  avgDailyTokens: number;
  projectedWeeklyCost: number;
  projectedMonthlyCost: number;
  trend: "increasing" | "stable" | "decreasing";
  trendPct: number;
}

export function calculateUsagePace(
  dailyData: UsageSummaryRow[],
): UsagePace | null {
  if (dailyData.length === 0) return null;

  const totalCost = dailyData.reduce((s, r) => s + r.total_cost, 0);
  const totalTokens = dailyData.reduce((s, r) => s + r.total_tokens, 0);
  const activeDays = dailyData.length;

  const avgDailyCost = totalCost / activeDays;
  const avgDailyTokens = totalTokens / activeDays;

  // Trend: compare last 7 days vs previous 7 days
  const sorted = [...dailyData].sort((a, b) => a.date.localeCompare(b.date));
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const firstAvg =
    firstHalf.length > 0
      ? firstHalf.reduce((s, r) => s + r.total_cost, 0) / firstHalf.length
      : 0;
  const secondAvg =
    secondHalf.length > 0
      ? secondHalf.reduce((s, r) => s + r.total_cost, 0) / secondHalf.length
      : 0;

  let trend: "increasing" | "stable" | "decreasing" = "stable";
  let trendPct = 0;
  if (firstAvg > 0) {
    trendPct = ((secondAvg - firstAvg) / firstAvg) * 100;
    if (trendPct > 10) trend = "increasing";
    else if (trendPct < -10) trend = "decreasing";
  }

  return {
    avgDailyCost,
    avgDailyTokens,
    projectedWeeklyCost: avgDailyCost * 7,
    projectedMonthlyCost: avgDailyCost * 30,
    trend,
    trendPct,
  };
}
