import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function getDashboardStats() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Today's date range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    { count: totalScans },
    { count: scansToday },
    { count: totalLeads },
    { count: leadsToday },
    { data: scanRows },
    { count: impressions },
    { count: clicks },
  ] = await Promise.all([
    // scan_stats total
    adminClient
      .from("scan_stats")
      .select("*", { count: "exact", head: true }),
    // scan_stats today
    adminClient
      .from("scan_stats")
      .select("*", { count: "exact", head: true })
      .gte("timestamp", todayStart.toISOString())
      .lte("timestamp", todayEnd.toISOString()),
    // leads total
    adminClient
      .from("leads")
      .select("*", { count: "exact", head: true }),
    // leads today
    adminClient
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString()),
    // top concerns from scan_stats
    adminClient
      .from("scan_stats")
      .select("detected_concerns"),
    // affiliate impressions (from old skin_scans events — keep backward compat)
    supabase
      .from("affiliate_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "impression"),
    // affiliate clicks
    supabase
      .from("affiliate_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "click"),
  ]);

  // Aggregate concern frequencies
  const freq = new Map<string, number>();
  for (const row of scanRows ?? []) {
    for (const c of (row.detected_concerns ?? []) as string[]) {
      freq.set(c, (freq.get(c) ?? 0) + 1);
    }
  }
  const topConcerns = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const imp = impressions ?? 0;
  const clk = clicks ?? 0;
  const ctr = imp > 0 ? Math.round((clk / imp) * 10000) / 100 : 0;

  return {
    totalScans: totalScans ?? 0,
    scansToday: scansToday ?? 0,
    totalLeads: totalLeads ?? 0,
    leadsToday: leadsToday ?? 0,
    topConcerns,
    impressions: imp,
    clicks: clk,
    ctr,
  };
}
