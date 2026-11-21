import Link from "next/link";

import { Brand } from "@/components/brand";
import { t } from "@/lib/i18n";

const FOOTER_LINKS = [
  { href: "/#features", labelKey: "landing.footer.product" },
  { href: "/calculators", labelKey: "landing.footer.calculators" },
  { href: "/#faq", labelKey: "landing.footer.faq" },
  { href: "/login", labelKey: "landing.footer.login" },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Brand />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t("landing.footer.tagline")}
          </p>
        </div>

        <nav
          aria-label={t("nav.main")}
          className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground"
        >
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-4 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{t("landing.footer.rights", { year })}</span>
          <span>{t("landing.footer.disclaimer")}</span>
        </div>
      </div>
    </footer>
  );
}
