import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/translations";

export const dynamic = "force-dynamic";

function aggregateConcerns(rows: { concerns: string[] | null }[]) {
  const freq = new Map<string, number>();
  for (const row of rows) {
    for (const c of row.concerns ?? []) {
      freq.set(c, (freq.get(c) ?? 0) + 1);
    }
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]);
}

export default async function AdminDashboardPage() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("admin_dashboard.supabase_not_configured_title")}</CardTitle>
          <CardDescription>
            {t("admin_dashboard.supabase_not_configured_description")}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const supabase = await createClient();

  const { count: scanCount, error: scanErr } = await supabase
    .from("skin_scans")
    .select("*", { count: "exact", head: true });

  const { data: scanRows, error: concernsErr } = await supabase
    .from("skin_scans")
    .select("concerns");

  const { count: impressionCount } = await supabase
    .from("affiliate_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "impression");

  const { count: clickCount } = await supabase
    .from("affiliate_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "click");

  const topConcerns =
    scanErr || concernsErr || !scanRows
      ? []
      : aggregateConcerns(scanRows).slice(0, 15);

  const impressions = impressionCount ?? 0;
  const clicks = clickCount ?? 0;
  const ctr =
    impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;

  const { data: productRows } = await supabase
    .from("affiliate_events")
    .select("product_id, event_type");

  const productStats = new Map<
    string,
    { impressions: number; clicks: number }
  >();
  for (const row of productRows ?? []) {
    const id = row.product_id;
    if (!productStats.has(id)) {
      productStats.set(id, { impressions: 0, clicks: 0 });
    }
    const s = productStats.get(id)!;
    if (row.event_type === "impression") s.impressions += 1;
    if (row.event_type === "click") s.clicks += 1;
  }

  const productTable = [...productStats.entries()]
    .map(([product_id, s]) => ({
      product_id,
      impressions: s.impressions,
      clicks: s.clicks,
      ctr:
        s.impressions > 0
          ? Math.round((s.clicks / s.impressions) * 10000) / 100
          : 0,
    }))
    .sort((a, b) => b.impressions - a.impressions);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("admin_dashboard.analytics_title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("admin_dashboard.analytics_description")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("admin_dashboard.total_scans")}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {scanErr ? "—" : (scanCount ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("admin_dashboard.affiliate_impressions")}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{impressions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("admin_dashboard.affiliate_ctr_global")}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {impressions > 0 ? `${ctr}%` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {t("admin_dashboard.ctr_description")}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin_dashboard.common_concerns_title")}</CardTitle>
          <CardDescription>
            {t("admin_dashboard.common_concerns_description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topConcerns.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin_dashboard.no_data")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin_dashboard.concern_column")}</TableHead>
                  <TableHead className="text-right">{t("admin_dashboard.count_column")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topConcerns.map(([concern, count]) => (
                  <TableRow key={concern}>
                    <TableCell>{concern}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin_dashboard.ctr_by_product_title")}</CardTitle>
          <CardDescription>
            {t("admin_dashboard.ctr_by_product_description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productTable.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("admin_dashboard.no_affiliate_events")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin_dashboard.product_id_column")}</TableHead>
                  <TableHead className="text-right">{t("admin_dashboard.impressions_column")}</TableHead>
                  <TableHead className="text-right">{t("admin_dashboard.clicks_column")}</TableHead>
                  <TableHead className="text-right">{t("admin_dashboard.ctr_column")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productTable.map((p) => (
                  <TableRow key={p.product_id}>
                    <TableCell className="font-mono text-xs">
                      {p.product_id}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.impressions}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.clicks}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.impressions > 0 ? `${p.ctr}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
