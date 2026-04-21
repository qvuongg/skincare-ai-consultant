import Link from "next/link";

import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { t } from "@/lib/translations";

export default function AdminDashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/"
              className="font-medium text-muted-foreground hover:text-foreground"
            >
              {t("admin_dashboard.site_link")}
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/admin" className="font-semibold text-foreground hover:text-[#D4AF37]">Dashboard</Link>
              <Link href="/admin/products" className="font-semibold text-foreground hover:text-[#D4AF37]">Sản phẩm</Link>
              <Link href="/admin/leads" className="font-semibold text-foreground hover:text-[#D4AF37]">Khách hàng</Link>
            </nav>
          </div>
          <AdminLogoutButton />
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
    </>
  );
}
