import { getDashboardStats } from "@/lib/supabase/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scan, Users, TrendingUp, MousePointerClick } from "lucide-react";

export const dynamic = "force-dynamic";

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
}

function StatCard({ title, value, sub, icon, accent }: StatCardProps) {
  return (
    <Card className={`bg-zinc-950 border-zinc-800 transition-all hover:border-[#D4AF37]/40 ${accent ? "border-[#D4AF37]/30" : ""}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardDescription className="text-zinc-400 text-sm font-medium">{title}</CardDescription>
        <div className="text-[#D4AF37]/70">{icon}</div>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold tabular-nums ${accent ? "text-[#D4AF37]" : "text-zinc-100"}`}>{value}</p>
        {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <Card className="bg-zinc-950 border-yellow-700/40">
        <CardHeader>
          <CardTitle className="text-yellow-400">Supabase chưa được cấu hình</CardTitle>
          <CardDescription className="text-zinc-400">
            Vui lòng thiết lập NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const stats = await getDashboardStats();
  const ctrDisplay = stats.impressions > 0 ? `${stats.ctr}%` : "—";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#D4AF37]">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">Tổng quan hoạt động ứng dụng theo thời gian thực.</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng lượt quét"
          value={stats.totalScans}
          sub={`Hôm nay: ${stats.scansToday} lượt`}
          icon={<Scan className="size-4" />}
          accent
        />
        <StatCard
          title="Khách hàng tiềm năng"
          value={stats.totalLeads}
          sub={`Hôm nay: ${stats.leadsToday} mới`}
          icon={<Users className="size-4" />}
        />
        <StatCard
          title="Lượt hiển thị affiliate"
          value={stats.impressions}
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          title="CTR Affiliate"
          value={ctrDisplay}
          sub={`${stats.clicks} click / ${stats.impressions} impression`}
          icon={<MousePointerClick className="size-4" />}
        />
      </div>

      {/* Top concerns */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-base">Vấn đề da phổ biến nhất</CardTitle>
          <CardDescription className="text-zinc-500 text-xs">
            Tổng hợp từ tất cả lượt quét (scan_stats)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topConcerns.length === 0 ? (
            <p className="text-sm text-zinc-500">Chưa có dữ liệu quét nào.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 text-xs">#</TableHead>
                  <TableHead className="text-zinc-400 text-xs">Vấn đề</TableHead>
                  <TableHead className="text-right text-zinc-400 text-xs">Số lượt</TableHead>
                  <TableHead className="text-right text-zinc-400 text-xs">Tỷ lệ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topConcerns.map(([concern, count], i) => {
                  const pct = stats.totalScans > 0 ? Math.round((count / stats.totalScans) * 100) : 0;
                  return (
                    <TableRow key={concern} className="border-b border-zinc-800/50 hover:bg-[#D4AF37]/5 transition-colors">
                      <TableCell className="text-zinc-500 text-sm w-8">{i + 1}</TableCell>
                      <TableCell className="text-zinc-200 text-sm font-medium">{concern}</TableCell>
                      <TableCell className="text-right text-zinc-300 tabular-nums text-sm">{count}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-[#D4AF37] text-sm font-medium tabular-nums">{pct}%</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
