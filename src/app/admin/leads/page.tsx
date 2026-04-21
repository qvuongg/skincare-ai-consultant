"use client";

import { useState, useEffect } from "react";
import { Download, Mail, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DBLead, fetchLeads } from "@/lib/supabase/db";

export default function LeadsPage() {
  const [leads, setLeads] = useState<DBLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    try {
      const data = await fetchLeads();
      setLeads(data);
    } catch (error) {
      console.error("Failed to load leads:", error);
    } finally {
      setLoading(false);
    }
  }

  function exportLeads() {
    const headers = ["ID", "Tên", "Liên hệ", "Loại da", "Mục tiêu", "Ngày tạo"];
    const csvContent = [
      headers.join(","),
      ...leads.map(l => [
        l.id,
        l.name,
        l.contact_info,
        l.skin_type_detected,
        l.primary_goal,
        new Date(l.created_at).toLocaleString('vi-VN')
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#D4AF37]">Danh sách khách hàng</h1>
          <p className="text-muted-foreground">Theo dõi và quản lý thông tin từ Onboarding.</p>
        </div>
        <Button 
          variant="outline" 
          className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
          onClick={exportLeads}
          disabled={leads.length === 0}
        >
          <Download className="mr-2 size-4" /> Xuất CSV
        </Button>
      </div>

      <Card className="bg-black border-[#D4AF37]/20">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-[#D4AF37]/10">
                <TableHead>Khách hàng</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Loại da</TableHead>
                <TableHead>Mục tiêu</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">Đang tải...</TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">Chưa có khách hàng nào.</TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id} className="border-b border-[#D4AF37]/5 hover:bg-[#D4AF37]/5">
                    <TableCell className="font-medium text-[#D4AF37]">{lead.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center text-xs"><Mail className="mr-1 size-3" /> {lead.contact_info}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#D4AF37]/50 text-[#D4AF37]">
                        {lead.skin_type_detected}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.primary_goal}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div className="flex items-center">
                        <Calendar className="mr-2 size-3" />
                        {new Date(lead.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
