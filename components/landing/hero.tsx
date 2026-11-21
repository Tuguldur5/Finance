import { ArrowRight, Calculator, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";

import { HeroSceneLoader } from "@/components/landing/hero-scene-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

const TRUST_LINES = [
  { icon: ShieldCheck, labelKey: "landing.hero.trustData" },
  { icon: Wallet, labelKey: "landing.hero.trustWallets" },
  { icon: Calculator, labelKey: "landing.hero.trustCalculators" },
] as const;

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/4 h-[420px] w-[420px] translate-x-1/4 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.12),transparent_65%)]"
      />

      <div className="relative mx-auto grid w-full max-w-5xl gap-10 px-4 pb-16 pt-28 md:grid-cols-2 md:items-center md:gap-8 md:pb-20 md:pt-32">
        <div className="order-2 md:order-1">
          <Badge
            variant="outline"
            className="border-blue-500/30 bg-blue-500/10 font-normal text-blue-300"
          >
            {t("landing.hero.badge")}
          </Badge>

          <h1 className="mt-5 max-w-lg text-4xl font-semibold leading-[1.1] tracking-tight text-balance text-neutral-50 md:text-5xl">
            {t("landing.hero.title")}
          </h1>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-400 md:text-base">
            {t("landing.hero.description")}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <Button asChild size="lg">
              <Link href="/login">
                {t("landing.hero.primaryCta")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/calculators">{t("landing.hero.secondaryCta")}</Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-col gap-2 text-xs text-neutral-400 sm:flex-row sm:flex-wrap sm:gap-x-5">
            {TRUST_LINES.map((line) => {
              const Icon = line.icon;

              return (
                <li key={line.labelKey} className="flex items-center gap-1.5">
                  <Icon
                    className="size-3.5 text-blue-400/80"
                    aria-hidden="true"
                  />
                  {t(line.labelKey)}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="order-1 h-[280px] md:order-2 md:h-[420px]">
          <HeroSceneLoader />
        </div>
      </div>
    </section>
  );
}
