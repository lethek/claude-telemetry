/**
 * GET /api/analytics/compare-periods?period_a=last_week&period_b=this_week&machine_id=...
 * Returns: cost/tokens for each period, % change, top 5 project movers.
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

async function supabaseRpc(env: Env, fn: string, params: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify(params),
  });
  return res.json();
}

function resolvePeriod(name: string): { start: string; end: string; label: string } {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Monday=0

  const sub = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() - n); return r.toISOString().slice(0, 10); };

  const periods: Record<string, { start: string; end: string; label: string }> = {
    today: { start: todayStr, end: todayStr, label: "Today" },
    yesterday: { start: sub(now, 1), end: sub(now, 1), label: "Yesterday" },
    this_week: { start: sub(now, dayOfWeek), end: todayStr, label: "This week" },
    last_week: { start: sub(now, dayOfWeek + 7), end: sub(now, dayOfWeek + 1), label: "Last week" },
    this_month: { start: `${todayStr.slice(0, 7)}-01`, end: todayStr, label: "This month" },
    last_month: {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10),
      end: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10),
      label: "Last month",
    },
  };

  return periods[name] || periods.this_week;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const periodA = url.searchParams.get("period_a") || "last_week";
  const periodB = url.searchParams.get("period_b") || "this_week";
  const machineId = url.searchParams.get("machine_id") || null;

  const a = resolvePeriod(periodA);
  const b = resolvePeriod(periodB);

  const [usageA, usageB, projA, projB] = await Promise.all([
    supabaseRpc(context.env, "get_usage_summary", { p_start_date: a.start, p_end_date: a.end, p_machine_id: machineId }),
    supabaseRpc(context.env, "get_usage_summary", { p_start_date: b.start, p_end_date: b.end, p_machine_id: machineId }),
    supabaseRpc(context.env, "get_project_costs", { p_start_date: a.start, p_end_date: a.end, p_machine_id: machineId }),
    supabaseRpc(context.env, "get_project_costs", { p_start_date: b.start, p_end_date: b.end, p_machine_id: machineId }),
  ]) as [
    Array<{ total_cost: number; total_tokens: number }>,
    Array<{ total_cost: number; total_tokens: number }>,
    Array<{ project: string; total_cost: number }>,
    Array<{ project: string; total_cost: number }>,
  ];

  const costA = (usageA || []).reduce((s, r) => s + (Number(r.total_cost) || 0), 0);
  const costB = (usageB || []).reduce((s, r) => s + (Number(r.total_cost) || 0), 0);
  const tokensA = (usageA || []).reduce((s, r) => s + (Number(r.total_tokens) || 0), 0);
  const tokensB = (usageB || []).reduce((s, r) => s + (Number(r.total_tokens) || 0), 0);

  const costChange = costA > 0 ? ((costB - costA) / costA) * 100 : costB > 0 ? 100 : 0;
  const tokensChange = tokensA > 0 ? ((tokensB - tokensA) / tokensA) * 100 : tokensB > 0 ? 100 : 0;

  // Top movers
  const mapA: Record<string, number> = {};
  for (const p of projA || []) mapA[p.project] = Number(p.total_cost) || 0;
  const mapB: Record<string, number> = {};
  for (const p of projB || []) mapB[p.project] = Number(p.total_cost) || 0;

  const allProjects = new Set([...Object.keys(mapA), ...Object.keys(mapB)]);
  const movers = [...allProjects]
    .map((proj) => ({
      project: proj,
      cost_a: mapA[proj] || 0,
      cost_b: mapB[proj] || 0,
      diff: (mapB[proj] || 0) - (mapA[proj] || 0),
    }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 5);

  return new Response(JSON.stringify({
    period_a: { ...a, cost: Math.round(costA * 100) / 100, tokens: tokensA },
    period_b: { ...b, cost: Math.round(costB * 100) / 100, tokens: tokensB },
    cost_change_pct: Math.round(costChange * 10) / 10,
    tokens_change_pct: Math.round(tokensChange * 10) / 10,
    movers,
  }), { headers: { "Content-Type": "application/json" } });
};
