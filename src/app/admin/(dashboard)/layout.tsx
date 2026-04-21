import Link from "next/link";
import { LayoutDashboard, Package, Users, Sparkles } from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

export default function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top nav bar */}
      <header className="sticky top-0 z-50 border-b border-[#D4AF37]/20 bg-zinc-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/30">
              <Sparkles className="size-4 text-[#D4AF37]" />
            </div>
            <span className="font-bold text-sm text-[#D4AF37] hidden sm:block tracking-wide">
              SKINCARE AI · ADMIN
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors"
            >
              <LayoutDashboard className="size-3.5" />
              Dashboard
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors"
            >
              <Package className="size-3.5" />
              Sản phẩm
            </Link>
            <Link
              href="/admin/leads"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors"
            >
              <Users className="size-3.5" />
              Khách hàng
            </Link>
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:block text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Trang web
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
