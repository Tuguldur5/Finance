"use client";

import Link from "next/link";
import * as React from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getCalculatorMeta } from "@/lib/calculators/registry";
import { t } from "@/lib/i18n";

import { DashboardBackLink } from "./dashboard-back-link";
import {
  BreakEvenCalculator,
  DiscountCalculator,
  MarginCalculator,
  ProfitCalculator,
} from "./business-calculators";
import {
  LoanCalculator,
  MortgageCalculator,
} from "./credit-calculators";
import {
  BudgetCalculator,
  CurrencyCalculator,
} from "./everyday-calculators";
import {
  CompoundCalculator,
  InterestCalculator,
  InvestmentCalculator,
  SavingsCalculator,
} from "./growth-calculators";
import { ShareButton } from "./shared";
import { SalaryCalculator, VatCalculator } from "./tax-calculators";

const BODIES: Record<string, React.ComponentType> = {
  loan: LoanCalculator,
  mortgage: MortgageCalculator,
  interest: InterestCalculator,
  compound: CompoundCalculator,
  savings: SavingsCalculator,
  investment: InvestmentCalculator,
  salary: SalaryCalculator,
  vat: VatCalculator,
  currency: CurrencyCalculator,
  profit: ProfitCalculator,
  margin: MarginCalculator,
  breakeven: BreakEvenCalculator,
  discount: DiscountCalculator,
  budget: BudgetCalculator,
};

export function CalculatorView({
  slug,
  variant = "public",
}: {
  slug: string;
  variant?: "public" | "embedded";
}) {
  const meta = getCalculatorMeta(slug);
  const Body = BODIES[slug];
  const embedded = variant === "embedded";
  const directoryHref = embedded ? "/app/calculators" : "/calculators";

  if (!meta || !Body) return null;

  return (
    <>
      {embedded ? null : <DashboardBackLink />}

      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={directoryHref}>
                {t("calculators.directoryTitle")}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{meta.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {meta.title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {meta.description}
          </p>
        </div>
        <ShareButton />
      </header>

      <Body />
    </>
  );
}
