interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const machine_id = url.searchParams.get("machine_id");
  const start_date = url.searchParams.get("start_date");
  const end_date = url.searchParams.get("end_date");
  const active_only = url.searchParams.get("active_only");

  const filters: string[] = [];
  if (machine_id) filters.push(`machine_id=eq.${machine_id}`);
  if (start_date) filters.push(`block_start=gte.${start_date}`);
  if (end_date) filters.push(`block_start=lte.${end_date}`);
  if (active_only === "true") filters.push("is_active=eq.true");

  const filterQuery = filters.length > 0 ? `&${filters.join("&")}` : "";

  const response = await fetch(
    `${context.env.SUPABASE_URL}/rest/v1/blocks?order=block_start.desc&limit=100${filterQuery}`,
    {
      headers: {
        apikey: context.env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${context.env.SUPABASE_SERVICE_KEY}`,
      },
    },
  );

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
};
