import type { Metadata } from "next";
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Landmark,
  Percent,
  PiggyBank,
  ReceiptText,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { Hero } from "@/components/landing/hero";
import { SiteHeader } from "@/components/landing/site-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config";
import { t } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: t("landing.metaTitle"),
  description: t("landing.metaDescription"),
  openGraph: {
    type: "website",
    locale: "mn_MN",
    siteName: APP_NAME,
    title: `${t("landing.metaTitle")} — ${APP_NAME}`,
    description: t("landing.metaDescription"),
  },
};

const FEATURES = [
  { icon: Wallet, titleKey: "landing.features.wallets", descKey: "landing.features.walletsDesc" },
  { icon: ArrowLeftRight, titleKey: "landing.features.income", descKey: "landing.features.incomeDesc" },
  { icon: PiggyBank, titleKey: "landing.features.budgets", descKey: "landing.features.budgetsDesc" },
  { icon: Target, titleKey: "landing.features.goals", descKey: "landing.features.goalsDesc" },
  { icon: Landmark, titleKey: "landing.features.debts", descKey: "landing.features.debtsDesc" },
  { icon: BarChart3, titleKey: "landing.features.reports", descKey: "landing.features.reportsDesc" },
] as const;

const CALCULATORS = [
  { slug: "loan", icon: Landmark, labelKey: "landing.calculators.loan" },
  { slug: "savings", icon: PiggyBank, labelKey: "landing.calculators.savings" },
  { slug: "interest", icon: Percent, labelKey: "landing.calculators.interest" },
  { slug: "salary", icon: ReceiptText, labelKey: "landing.calculators.salary" },
  { slug: "vat", icon: ReceiptText, labelKey: "landing.calculators.vat" },
  { slug: "currency", icon: ArrowLeftRight, labelKey: "landing.calculators.currency" },
] as const;

const FAQ_ITEMS = [
  { value: "data", titleKey: "landing.faq.dataTitle", descKey: "landing.faq.dataDescription" },
  { value: "free", titleKey: "landing.faq.freeTitle", descKey: "landing.faq.freeDescription" },
  { value: "google", titleKey: "landing.faq.googleTitle", descKey: "landing.faq.googleDescription" },
  { value: "currency", titleKey: "landing.faq.currencyTitle", descKey: "landing.faq.currencyDescription" },
] as const;

async function getIsAuthenticated(): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;

  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return Boolean(session?.user);
  } catch {
    return false;
  }
}

export default async function LandingPage() {
  const isAuthenticated = await getIsAuthenticated();
  const year = new Date().getFullYear();
  const footerLinks = [
    { href: "#features", label: t("landing.footer.product") },
    { href: "/calculators", label: t("landing.footer.calculators") },
    { href: "#faq", label: t("landing.footer.faq") },
    {
      href: isAuthenticated ? "/app" : "/login",
      label: isAuthenticated
        ? t("landing.footer.dashboard")
        : t("landing.footer.login"),
    },
  ];

  return (
    <div className="dark min-h-svh bg-black text-neutral-50">
      <SiteHeader isAuthenticated={isAuthenticated} />

      <main>
        <Hero />

        <section
          id="features"
          className="scroll-mt-24 border-b border-white/5 py-16 md:py-20"
        >
          <div className="mx-auto w-full max-w-5xl px-4">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                {t("landing.features.eyebrow")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance md:text-3xl">
                {t("landing.features.title")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                {t("landing.features.subtitle")}
              </p>
            </div>

            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;

                return (
                  <li
                    key={feature.titleKey}
                    className="rounded-lg border border-white/[0.08] bg-[#0a0a0a] p-5"
                  >
                    <span className="flex size-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03]">
                      <Icon
                        className="size-4 text-blue-400"
                        aria-hidden="true"
                      />
                    </span>
                    <h3 className="mt-3 text-sm font-medium text-neutral-100">
                      {t(feature.titleKey)}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                      {t(feature.descKey)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section
          id="calculators"
          className="scroll-mt-24 border-b border-white/5 py-16 md:py-20"
        >
          <div className="mx-auto w-full max-w-5xl px-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  {t("landing.calculators.eyebrow")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance md:text-3xl">
                  {t("landing.calculators.title")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                  {t("landing.calculators.subtitle")}
                </p>
              </div>

              <Button asChild variant="outline" size="sm">
                <Link href="/calculators">
                  {t("landing.calculators.cta")}
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>

            <ul className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {CALCULATORS.map((calculator) => {
                const Icon = calculator.icon;

                return (
                  <li key={calculator.slug} className="h-full">
                    <Link
                      href={`/calculators/${calculator.slug}`}
                      className="group flex h-full items-center gap-2 rounded-md border border-white/[0.08] bg-[#0a0a0a] px-3 py-3 text-xs text-neutral-300 transition-colors hover:border-blue-500/40 hover:text-neutral-50"
                    >
                      <Icon
                        className="size-4 shrink-0 text-neutral-500 transition-colors group-hover:text-blue-400"
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {t(calculator.labelKey)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section
          id="faq"
          className="scroll-mt-24 border-b border-white/5 py-16 md:py-20"
        >
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 md:grid-cols-[0.8fr_1.2fr] md:gap-12">
            <div className="max-w-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                {t("landing.faq.eyebrow")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance md:text-3xl">
                {t("landing.faq.title")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                {t("landing.faq.subtitle")}
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item) => (
                <AccordionItem
                  key={item.value}
                  value={item.value}
                  className="border-white/[0.08]"
                >
                  <AccordionTrigger className="text-sm text-neutral-200 hover:no-underline">
                    {t(item.titleKey)}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-2xl text-xs leading-relaxed text-neutral-400">
                    {t(item.descKey)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-5xl px-4">
            <div className="flex flex-col gap-5 rounded-xl border border-white/10 bg-[#0a0a0a] px-6 py-8 md:flex-row md:items-center md:justify-between md:px-8">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-balance md:text-2xl">
                  {t("landing.cta.title")}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-400">
                  {t("landing.cta.description")}
                </p>
              </div>

              <Button asChild size="lg" className="shrink-0">
                <Link href="/login">
                  {t("landing.cta.button")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Brand />
            <p className="mt-3 text-xs leading-relaxed text-neutral-500">
              {t("landing.footer.tagline")}
            </p>
          </div>

          <nav
            aria-label={t("landing.nav.main")}
            className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-neutral-400"
          >
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-neutral-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/5">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-4 text-[11px] text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
            <span>{t("landing.footer.rights", { year })}</span>
            <span>{t("landing.footer.disclaimer")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
