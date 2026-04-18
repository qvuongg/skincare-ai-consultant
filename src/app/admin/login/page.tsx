import { Suspense } from "react";

import { AdminLoginForm } from "./login-form";
import { t } from "@/lib/translations";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center px-4 text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
