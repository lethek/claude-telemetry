export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function rangeToDate(range: string): { start: string; end: string } {
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  return { start: daysAgo(days), end: today() };
}

export interface WeeklyData {
  week: string; // "2026-W14"
  startDate: string;
  totalCost: number;
  totalTokens: number;
  opusCost: number;
  sonnetCost: number;
  haikuCost: number;
}

export function getISOWeekStart(dateStr: string, weekStartDay: string = "monday"): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const target = weekStartDay === "sunday" ? 0 : 1;
  const diff = (day - target + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function getISOWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000) + 1;
  const weekNum = Math.ceil(dayOfYear / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function groupByWeek(
  dailyData: Array<{
    date: string;
    total_cost: number;
    total_tokens: number;
    opus_cost: number;
    sonnet_cost: number;
    haiku_cost: number;
  }>,
  weekStartDay: string = "monday",
): WeeklyData[] {
  const weekMap = new Map<string, WeeklyData>();

  for (const row of dailyData) {
    const weekStart = getISOWeekStart(row.date, weekStartDay);
    const label = getISOWeekLabel(weekStart);
    const existing = weekMap.get(weekStart);
    if (existing) {
      existing.totalCost += row.total_cost;
      existing.totalTokens += row.total_tokens;
      existing.opusCost += row.opus_cost;
      existing.sonnetCost += row.sonnet_cost;
      existing.haikuCost += row.haiku_cost;
    } else {
      weekMap.set(weekStart, {
        week: label,
        startDate: weekStart,
        totalCost: row.total_cost,
        totalTokens: row.total_tokens,
        opusCost: row.opus_cost,
        sonnetCost: row.sonnet_cost,
        haikuCost: row.haiku_cost,
      });
    }
  }

  return Array.from(weekMap.values()).sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
