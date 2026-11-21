"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import { Money } from "@/components/money";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calcCompoundInterest,
  calcInvestmentReturn,
  calcSavings,
  calcSimpleInterest,
} from "@/lib/calculators/interest";
import { formatMoney, formatNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";

import {
  CalculatorFrame,
  FormActions,
  NumberField,
  ResultHero,
  ResultRow,
  compactMoney,
  readNumber,
  useCalculatorState,
} from "./shared";

const growthConfig = {
  balance: { label: t("calculators.table.balance"), color: "var(--chart-1)" },
  contributed: {
    label: t("calculators.outputs.contributions"),
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

type GrowthPoint = { year: number; balance: number; contributed?: number };

function GrowthChart({
  data,
  showContributed = false,
}: {
  data: GrowthPoint[];
  showContributed?: boolean;
}) {
  if (data.length < 2) return null;

  return (
    <ChartContainer config={growthConfig} className="h-44 w-full">
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => String(value)}
        />
        <YAxis
          width={52}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => compactMoney(value)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatMoney(Number(value))}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="var(--color-balance)"
          strokeWidth={2}
          dot={false}
        />
        {showContributed ? (
          <Line
            type="monotone"
            dataKey="contributed"
            stroke="var(--color-contributed)"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
          />
        ) : null}
      </LineChart>
    </ChartContainer>
  );
}

export function InterestCalculator() {
  const defaults = { principal: "1000000", annualRate: "10", years: "3" };
  const { draft, applied, setValue, apply, reset } =
    useCalculatorState(defaults);

  const result = calcSimpleInterest({
    principal: readNumber(applied, "principal"),
    annualRate: readNumber(applied, "annualRate"),
    years: readNumber(applied, "years"),
  });

  const form = (
    <form onSubmit={apply} className="space-y-3" noValidate>
      <NumberField
        label={t("calculators.fields.principal")}
        value={draft.principal}
        onChange={(value) => setValue("principal", value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t("calculators.fields.annualRate")}
          value={draft.annualRate}
          onChange={(value) => setValue("annualRate", value)}
        />
        <NumberField
          label={t("calculators.fields.years")}
          value={draft.years}
          onChange={(value) => setValue("years", value)}
          max={100}
        />
      </div>
      <FormActions onReset={reset} />
    </form>
  );

  const results = (
    <div className="space-y-3">
      <ResultHero label={t("calculators.outputs.interest")}>
        <Money amount={result.interest} />
      </ResultHero>
      <ResultRow
        label={t("calculators.fields.principal")}
        value={<Money amount={result.principal} />}
      />
      <ResultRow
        label={t("calculators.outputs.finalAmount")}
        value={<Money amount={result.total} />}
        strong
      />
      <GrowthChart data={result.yearly} />
    </div>
  );

  return <CalculatorFrame form={form} results={results} />;
}

export function CompoundCalculator() {
  const defaults = {
    principal: "1000000",
    annualRate: "10",
    years: "10",
    compoundsPerYear: "12",
  };
  const { draft, applied, setValue, apply, reset } =
    useCalculatorState(defaults);

  const result = calcCompoundInterest({
    principal: readNumber(applied, "principal"),
    annualRate: readNumber(applied, "annualRate"),
    years: readNumber(applied, "years"),
    compoundsPerYear: readNumber(applied, "compoundsPerYear", 12),
  });

  const form = (
    <form onSubmit={apply} className="space-y-3" noValidate>
      <NumberField
        label={t("calculators.fields.principal")}
        value={draft.principal}
        onChange={(value) => setValue("principal", value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t("calculators.fields.annualRate")}
          value={draft.annualRate}
          onChange={(value) => setValue("annualRate", value)}
        />
        <NumberField
          label={t("calculators.fields.years")}
          value={draft.years}
          onChange={(value) => setValue("years", value)}
          max={100}
        />
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs font-medium">
          {t("calculators.fields.compoundsPerYear")}
        </Label>
        <Select
          value={draft.compoundsPerYear}
          onValueChange={(value) => setValue("compoundsPerYear", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="12">12</SelectItem>
            <SelectItem value="365">365</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <FormActions onReset={reset} />
    </form>
  );

  const results = (
    <div className="space-y-3">
      <ResultHero label={t("calculators.outputs.finalAmount")}>
        <Money amount={result.finalAmount} />
      </ResultHero>
      <ResultRow
        label={t("calculators.outputs.interest")}
        value={<Money amount={result.interest} />}
      />
      <ResultRow
        label={t("calculators.outputs.effectiveRate")}
        value={`${formatNumber(result.effectiveRate, 2)}%`}
      />
      <GrowthChart data={result.yearly} />
    </div>
  );

  return <CalculatorFrame form={form} results={results} />;
}

export function SavingsCalculator() {
  const defaults = {
    initial: "0",
    monthly: "200000",
    annualRate: "10",
    months: "24",
  };
  const { draft, applied, setValue, apply, reset } =
    useCalculatorState(defaults);

  const result = calcSavings({
    initial: readNumber(applied, "initial"),
    monthly: readNumber(applied, "monthly"),
    annualRate: readNumber(applied, "annualRate"),
    months: readNumber(applied, "months"),
  });

  const form = (
    <form onSubmit={apply} className="space-y-3" noValidate>
      <NumberField
        label={t("calculators.fields.initialAmount")}
        value={draft.initial}
        onChange={(value) => setValue("initial", value)}
      />
      <NumberField
        label={t("calculators.fields.monthlyContribution")}
        value={draft.monthly}
        onChange={(value) => setValue("monthly", value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t("calculators.fields.annualRate")}
          value={draft.annualRate}
          onChange={(value) => setValue("annualRate", value)}
        />
        <NumberField
          label={t("calculators.fields.months")}
          value={draft.months}
          onChange={(value) => setValue("months", value)}
          max={600}
          step={1}
        />
      </div>
      <FormActions onReset={reset} />
    </form>
  );

  const results = (
    <div className="space-y-3">
      <ResultHero
        label={t("calculators.outputs.finalAmount")}
        hint={`${t("calculators.fields.months")}: ${result.months}`}
      >
        <Money amount={result.finalAmount} />
      </ResultHero>
      <ResultRow
        label={t("calculators.outputs.contributions")}
        value={<Money amount={result.contributions} />}
      />
      <ResultRow
        label={t("calculators.outputs.interest")}
        value={<Money amount={result.interest} />}
      />
      <GrowthChart data={result.yearly} showContributed />
    </div>
  );

  return <CalculatorFrame form={form} results={results} />;
}

export function InvestmentCalculator() {
  const defaults = {
    initial: "1000000",
    monthly: "200000",
    annualRate: "12",
    years: "10",
  };
  const { draft, applied, setValue, apply, reset } =
    useCalculatorState(defaults);

  const result = calcInvestmentReturn({
    initial: readNumber(applied, "initial"),
    monthly: readNumber(applied, "monthly"),
    annualRate: readNumber(applied, "annualRate"),
    years: readNumber(applied, "years"),
  });

  const form = (
    <form onSubmit={apply} className="space-y-3" noValidate>
      <NumberField
        label={t("calculators.fields.initialAmount")}
        value={draft.initial}
        onChange={(value) => setValue("initial", value)}
      />
      <NumberField
        label={t("calculators.fields.monthlyContribution")}
        value={draft.monthly}
        onChange={(value) => setValue("monthly", value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t("calculators.fields.annualRate")}
          value={draft.annualRate}
          onChange={(value) => setValue("annualRate", value)}
        />
        <NumberField
          label={t("calculators.fields.years")}
          value={draft.years}
          onChange={(value) => setValue("years", value)}
          max={60}
        />
      </div>
      <FormActions onReset={reset} />
    </form>
  );

  const results = (
    <div className="space-y-3">
      <ResultHero
        label={t("calculators.outputs.finalAmount")}
        hint={`${t("calculators.outputs.roi")}: ${formatNumber(result.roiPercent, 1)}%`}
      >
        <Money amount={result.finalAmount} />
      </ResultHero>
      <ResultRow
        label={t("calculators.outputs.contributions")}
        value={<Money amount={result.contributions} />}
      />
      <ResultRow
        label={t("calculators.outputs.interest")}
        value={<Money amount={result.interest} />}
      />
      <GrowthChart data={result.yearly} showContributed />
    </div>
  );

  return <CalculatorFrame form={form} results={results} />;
}
