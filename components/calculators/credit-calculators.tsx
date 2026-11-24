"use client";

import * as React from "react";

import { LoanResult } from "@/components/finance/loan-result";
import { Money } from "@/components/money";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calcCredit, calcMortgage } from "@/lib/calculators/credit";
import { formatNumber } from "@/lib/finance/format";
import { todayISO } from "@/lib/date";
import { t } from "@/lib/i18n";

import {
  CalculatorFrame,
  FormActions,
  NumberField,
  ResultRow,
  readNumber,
  useCalculatorState,
} from "./shared";

export function LoanCalculator() {
  const defaults = {
    principal: "10000000",
    annualRate: "12",
    termMonths: "24",
    paymentType: "annuity",
  };
  const { draft, applied, setValue, apply, reset } =
    useCalculatorState(defaults);

  const paymentType =
    applied.paymentType === "equal_principal" ? "equal_principal" : "annuity";

  const result = React.useMemo(
    () =>
      calcCredit({
        principal: readNumber(applied, "principal"),
        annualRate: readNumber(applied, "annualRate"),
        termMonths: readNumber(applied, "termMonths"),
        paymentType,
        startDate: todayISO(),
      }),
    [applied.principal, applied.annualRate, applied.termMonths, paymentType],
  );

  const form = (
    <form onSubmit={apply} className="space-y-3" noValidate>
      <NumberField
        label={t("calculators.fields.principal")}
        value={draft.principal}
        onChange={(value) => setValue("principal", value)}
        format="money"
      />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t("calculators.fields.annualRate")}
          value={draft.annualRate}
          onChange={(value) => setValue("annualRate", value)}
          format="percent"
        />
        <NumberField
          label={t("calculators.fields.termMonths")}
          value={draft.termMonths}
          onChange={(value) => setValue("termMonths", value)}
          format="months"
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs font-medium">
          {t("calculators.fields.paymentType")}
        </Label>
        <Select
          value={draft.paymentType}
          onValueChange={(value) => setValue("paymentType", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="annuity">
              {t("calculators.paymentTypes.annuity")}
            </SelectItem>
            <SelectItem value="equal_principal">
              {t("calculators.paymentTypes.equalPrincipal")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FormActions onReset={reset} />
    </form>
  );

  return (
    <CalculatorFrame
      form={form}
      results={
        <LoanResult schedule={result.schedule} paymentType={paymentType} />
      }
      summary={{
        label: t("loanResult.monthlyPayment"),
        value: <Money amount={result.schedule[0]?.payment ?? 0} />,
      }}
    />
  );
}

export function MortgageCalculator() {
  const defaults = {
    propertyPrice: "200000000",
    downPayment: "40000000",
    annualRate: "8",
    termYears: "20",
  };
  const { draft, applied, setValue, apply, reset } =
    useCalculatorState(defaults);

  const result = React.useMemo(
    () =>
      calcMortgage({
        propertyPrice: readNumber(applied, "propertyPrice"),
        downPayment: readNumber(applied, "downPayment"),
        annualRate: readNumber(applied, "annualRate"),
        termYears: readNumber(applied, "termYears"),
        startDate: todayISO(),
      }),
    [
      applied.propertyPrice,
      applied.downPayment,
      applied.annualRate,
      applied.termYears,
    ],
  );

  const form = (
    <form onSubmit={apply} className="space-y-3" noValidate>
      <NumberField
        label={t("calculators.fields.propertyPrice")}
        value={draft.propertyPrice}
        onChange={(value) => setValue("propertyPrice", value)}
        format="money"
      />
      <NumberField
        label={t("calculators.fields.downPayment")}
        value={draft.downPayment}
        onChange={(value) => setValue("downPayment", value)}
        format="money"
      />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t("calculators.fields.annualRate")}
          value={draft.annualRate}
          onChange={(value) => setValue("annualRate", value)}
          format="percent"
        />
        <NumberField
          label={t("calculators.fields.termYears")}
          value={draft.termYears}
          onChange={(value) => setValue("termYears", value)}
          format="years"
        />
      </div>
      <FormActions onReset={reset} />
    </form>
  );

  return (
    <CalculatorFrame
      form={form}
      results={
        <div className="space-y-4">
          <div>
            <ResultRow
              label={t("calculators.outputs.loanAmount")}
              value={<Money amount={result.loanAmount} />}
            />
            <ResultRow
              label={t("calculators.fields.downPayment")}
              value={
                <span>
                  <Money amount={result.downPayment} />
                  <span className="ml-1 text-muted-foreground">
                    ({formatNumber(result.downPaymentPercent, 1)}%)
                  </span>
                </span>
              }
            />
          </div>

          <LoanResult schedule={result.schedule} paymentType="annuity" />
        </div>
      }
      summary={{
        label: t("loanResult.monthlyPayment"),
        value: <Money amount={result.schedule[0]?.payment ?? 0} />,
      }}
    />
  );
}
