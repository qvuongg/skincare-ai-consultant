"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Download, Mail, Calendar, Search, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DBLead } from "@/lib/supabase/db";

type LeadRecord = Partial<DBLead> & {
  user_name?: string | null;
  raw_data?: Record<string, unknown> | null;
};

type LeadView = {
  id: string;
  name: string;
  contact_info: string;
  skin_type_detected: string;
  primary_goal: string;
  created_at: string;
};

function pickText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function normalizeLead(lead: LeadRecord): LeadView {
  const raw = lead.raw_data && typeof lead.raw_data === "object" ? lead.raw_data : null;

  return {
    id: pickText(lead.id) || crypto.randomUUID(),
    name: pickText(lead.name, lead.user_name, raw?.user_name, raw?.name) || "Khách ẩn danh",
    contact_info: pickText(lead.contact_info, raw?.contact_info, raw?.email, raw?.phone) || "Chưa cung cấp",
    skin_type_detected:
      pickText(lead.skin_type_detected, raw?.skin_type_detected, raw?.skin_type) || "Chưa phân loại",
    primary_goal: pickText(lead.primary_goal, raw?.primary_goal) || "Chưa cung cấp",
    created_at: pickText(lead.created_at, raw?.created_at, raw?.timestamp) || new Date(0).toISOString(),
  };
}

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/leads");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: LeadRecord[] = await res.json();
      const normalized = data.map(normalizeLead);
      setLeads(normalized);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi không xác định";
      setError("Không thể tải danh sách khách hàng: " + message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLeads();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadLeads]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.contact_info.toLowerCase().includes(q) ||
      l.skin_type_detected.toLowerCase().includes(q) ||
      l.primary_goal.toLowerCase().includes(q)
    );
  }, [search, leads]);

  function exportCSV() {
    const headers = ["ID", "Tên", "Liên hệ", "Loại da", "Mục tiêu", "Ngày tạo"];
    const rows = filtered.map(l => [
      l.id,
      csvEscape(l.name),
      csvEscape(l.contact_info),
      csvEscape(l.skin_type_detected),
      csvEscape(l.primary_goal),
      new Date(l.created_at).toLocaleString("vi-VN"),
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#D4AF37]">Danh sách khách hàng</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Khách hàng tiềm năng từ luồng Onboarding.{" "}
            <span className="text-[#D4AF37]/70">{leads.length} tổng cộng</span>
          </p>
        </div>
        <Button
          variant="outline"
          className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all"
          onClick={exportCSV}
          disabled={filtered.length === 0}
        >
          <Download className="mr-2 size-4" /> Xuất CSV ({filtered.length})
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
        <Input
          placeholder="Tìm theo tên, email, loại da..."
          className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-[#D4AF37]/50"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="bg-zinc-950 border-[#D4AF37]/20 overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-zinc-800">
          <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
            <Users className="size-4 text-[#D4AF37]" />
            Leads
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs">{filtered.length} kết quả</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="px-6 py-10 text-center text-sm text-red-400">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-zinc-800">
                    {["Khách hàng","Liên hệ","Loại da","Mục tiêu chính","Ngày đăng ký"].map(h => (
                      <TableHead key={h} className="text-zinc-400 text-xs font-medium">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-16 text-center">
                        <Loader2 className="mx-auto size-6 animate-spin text-[#D4AF37]" />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-16 text-center text-zinc-500">
                        {search ? "Không tìm thấy kết quả." : "Chưa có khách hàng nào."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(lead => (
                      <TableRow key={lead.id} className="border-b border-zinc-800/60 hover:bg-[#D4AF37]/5 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-[#D4AF37] text-xs font-bold">
                                {lead.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-semibold text-zinc-100 text-sm">{lead.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-zinc-400 text-sm">
                            <Mail className="size-3 flex-shrink-0" />
                            {lead.contact_info}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37] text-[11px]">
                            {lead.skin_type_detected}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-300 text-sm max-w-[200px]">
                          <span className="line-clamp-2">{lead.primary_goal}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                            <Calendar className="size-3 flex-shrink-0" />
                            {new Date(lead.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
