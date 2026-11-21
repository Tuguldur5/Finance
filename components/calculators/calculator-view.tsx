"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { PageHeader } from "@/components/page-header";
import { getCalculatorMeta } from "@/lib/calculators/registry";
import { t } from "@/lib/i18n";

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

export function CalculatorView({ slug }: { slug: string }) {
  const meta = getCalculatorMeta(slug);
  const Body = BODIES[slug];

  if (!meta || !Body) return null;

  return (
    <>
      <Link
        href="/calculators"
        className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {t("calculators.title")}
      </Link>

      <PageHeader
        title={t(`calculators.items.${slug}.title`)}
        description={t(`calculators.items.${slug}.description`)}
        actions={<ShareButton />}
      />

      <Body />
    </>
  );
}
