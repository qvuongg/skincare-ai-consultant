import { Activity, Camera, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/translations";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-card to-background px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <Badge
          variant="secondary"
          className="mb-4 border border-border bg-secondary/80"
        >
          {t("hero.badge")}
        </Badge>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
          {t("hero.description")}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("hero.disclaimer")}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#scanner"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("hero.start_scan")}
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("hero.how_it_works")}
          </a>
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const items = [
    {
      icon: Camera,
      title: t("features.items.0.title"),
      body: t("features.items.0.body"),
    },
    {
      icon: Sparkles,
      title: t("features.items.1.title"),
      body: t("features.items.1.body"),
    },
    {
      icon: ShieldCheck,
      title: t("features.items.2.title"),
      body: t("features.items.2.body"),
    },
    {
      icon: Activity,
      title: t("features.items.3.title"),
      body: t("features.items.3.body"),
    },
  ] as const;

  return (
    <section
      id="how-it-works"
      className="border-b border-border bg-background px-4 py-16 sm:px-6"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("features.title")}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground sm:text-base">
          {t("features.description")}
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {items.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-foreground/5"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-medium text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-4 text-center text-xs text-muted-foreground sm:text-sm">
        <p className="font-medium text-foreground/90">
          {t("footer.medical_disclaimer_title")}
        </p>
        <p>{t("footer.medical_disclaimer_body")}</p>
        <p>
          <strong className="text-foreground/90">
            {t("footer.affiliate_disclosure_title")}
          </strong>{" "}
          {t("footer.affiliate_disclosure_body")}
        </p>
        <p className="text-[11px] text-muted-foreground/90">
          {t("footer.copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
