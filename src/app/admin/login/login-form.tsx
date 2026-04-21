"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/translations";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      if (signError) {
        setError(signError.message);
        return;
      }
      const user = data.user;
      if (user?.app_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        setError(t("admin.not_authorized"));
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError(t("admin.generic_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand mark */}
        <div className="text-center space-y-2">
          <div className="mx-auto size-12 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
            <svg className="size-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#D4AF37] tracking-wide">SKINCARE AI · ADMIN</h1>
          <p className="text-sm text-zinc-500">{t("admin.login_description")}</p>
        </div>

        <Card className="bg-zinc-900 border-[#D4AF37]/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-zinc-100 text-lg">{t("admin.login_title")}</CardTitle>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-950/60 border-red-700/50">
                  <AlertTitle className="text-red-300">{t("admin.login_failed")}</AlertTitle>
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-zinc-300 text-sm">{t("admin.email_label")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 focus-visible:ring-[#D4AF37]/50"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-zinc-300 text-sm">{t("admin.password_label")}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 focus-visible:ring-[#D4AF37]/50"
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-[#D4AF37] text-black font-semibold hover:bg-[#B8962E] transition-colors"
                disabled={loading}
              >
                {loading ? t("admin.signing_in") : t("admin.sign_in")}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
