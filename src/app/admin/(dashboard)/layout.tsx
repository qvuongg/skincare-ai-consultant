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
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="font-medium text-muted-foreground hover:text-foreground"
            >
              {t("admin_dashboard.site_link")}
            </Link>
            <span className="font-semibold text-foreground">{t("admin_dashboard.admin_label")}</span>
          </div>
          <AdminLogoutButton />
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
    </>
  );
}
