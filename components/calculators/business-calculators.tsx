"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";

import { Money } from "@/components/money";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  calcBreakEven,
  calcDiscount,
  calcMargin,
  calcProfit,
} from "@/lib/calculators/business";
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

const profitConfig = {
  revenue: { label: t("calculators.fields.revenue"), color: "var(--chart-2)" },
  cost: { label: t("calculators.fields.cost"), color: "var(--chart-5)" },
  profit: { label: t("calculators.outputs.profit"), color: "var(--chart-1)" },
} satisfies ChartConfig;

const breakEvenConfig = {
  fixedCosts: {
    label: t("calculators.fields.fixedCosts"),
    color: "var(--chart-5)",
  },
  breakEvenRevenue: {
    label: t("calculators.outputs.breakEvenRevenue"),
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function ProfitCalculator() {
  const defaults = { revenue: "10000000", cost: "6000000" };
  const { draft, applied, setValue, apply, reset } =
    useCalculatorState(defaults);

  const result = calcProfit({
    revenue: readNumber(applied, "revenue"),
    cost: readNumber(applied, "cost"),
  });

  const form = (
    <form onSubmit={apply} className="space-y-3" noValidate>
      <NumberField
        label={t("calculators.fields.revenue")}
        value={draft.revenue}
        onChange={(value) => setValue("revenue", value)}
      />
      <NumberField
        label={t("calculators.fields.cost")}
        value={draft.cost}
        onChange={(value) => setValue("cost", value)}
      />
      <FormActions onReset={reset} />
    </form>
  );

  const results = (
    <div className="space-y-3">
      <ResultHero label={t("calculators.outputs.profit")}>
        <Money amount={result.profit} tone={result.isLoss ? "negative" : "positive"} />
      </ResultHero>
      <ResultRow
        label={t("calculators.outputs.margin")}
        value={`${formatNumber(result.marginPercent, 1)}%`}
        strong
      />
      <ResultRow
        label={t("calculators.fields.revenue")}
        value={<Money amount={result.revenue} />}
      />
      <ResultRow
        label={t("calculators.fields.cost")}
        value={<Money amount={result.cost} />}
      />

      <ChartContainer config={profitConfig} className="h-40 w-full">
        <BarChart
          data={[result]}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <XAxis dataKey="revenue" hide />
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
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="cost" fill="var(--color-cost)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="profit" fill="var(--color-profit)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );

  return <CalculatorFrame form={form} results={results} />;
}

export function MarginCalculator() {
  const defaults = { revenue: "10000000", cost: "6000000" };
  const { draft, applied, setValue, apply, reset } =
    useCalculatorState(defaults);

  const result = calcMargin({
    revenue: readNumber(applied, "revenue"),
    cost: readNumber(applied, "cost"),
  });

  const form = (
    <form onSubmit={apply} className="space-y-3" noValidate>
      <NumberField
        label={t("calculators.fields.revenue")}
        value={draft.revenue}
        onChange={(value) => setValue("revenue", value)}
      />
      <NumberField
        label={t("calculators.fields.cost")}
        value={draft.cost}
        onChange={(value) => setValue("cost", value)}
      />
      <FormActions onReset={reset} />
    </form>
  );

  const results = (
    <div className="space-y-3">
      <ResultHero label={t("calculators.outputs.margin")}>
        {formatNumber(result.marginPercent, 1)}%
      </ResultHero>
      <div>
        <ResultRow
          label={t("calculators.outputs.markup")}
          value={`${formatNumber(result.markupPercent, 1)}%`}
        />
        <ResultRow
          label={t("calculators.outputs.costShare")}
          value={`${formatNumber(result.costPercent, 1)}%`}
        />
        <ResultRow
          label={t("calculators.outputs.profit")}
          value={<Money amount={result.profit} />}
          strong
        />
        <ResultRow
          label={t("calculators.fields.revenue")}
          value={<Money amount={result.revenue} />}
        />
        <ResultRow
          label={t("calculators.fields.cost")}
          value={<Money amount={result.cost} />}
        />
      </div>
    </div>
  );

  return <CalculatorFrame form={form} results={results} />;
}

export function BreakEvenCalculator() {
  const defaults = {
    fixedCosts: "5000000",
    pricePerUnit: "100000",
    variableCostPerUnit: "60000",
  };
  const { draft, applied, setValue, apply, reset } =
    useCalculatorState(defaults);

  const result = calcBreakEven({
    fixedCosts: readNumber(applied, "fixedCosts"),
    pricePerUnit: readNumber(applied, "pricePerUnit"),
    variableCostPerUnit: readNumber(applied, "variableCostPerUnit"),
  });

  const form = (
    <form onSubmit={apply} className="space-y-3" noValidate>
      <NumberField
        label={t("calculators.fields.fixedCosts")}
        value={draft.fixedCosts}
        onChange={(value) => setValue("fixedCosts", value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t("calculators.fields.pricePerUnit")}
          value={draft.pricePerUnit}
          onChange={(value) => setValue("pricePerUnit", value)}
        />
        <NumberField
          label={t("calculators.fields.variableCostPerUnit")}
          value={draft.variableCostPerUnit}
          onChange={(value) => setValue("variableCostPerUnit", value)}
        />
      </div>
      <FormActions onReset={reset} />
    </form>
  );

  const results = (
    <div className="space-y-3">
      <ResultHero
        label={t("calculators.outputs.breakEvenUnits")}
        hint={`${t("calculators.outputs.breakEvenRevenue")}: ${formatMoney(result.breakEvenRevenue)}`}
      >
        {result.isFeasible ? formatNumber(result.breakEvenUnits) : "—"}
      </ResultHero>

      <div>
        <ResultRow
          label={t("calculators.outputs.contributionPerUnit")}
          value={<Money amount={result.contributionPerUnit} />}
        />
        <ResultRow
          label={t("calculators.fields.fixedCosts")}
          value={<Money amount={result.fixedCosts} />}
        />
        <ResultRow
          label={t("calculators.outputs.breakEvenRevenue")}
          value={<Money amount={result.breakEvenRevenue} />}
          strong
        />
      </div>

      {!result.isFeasible ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          Нэгжийн үнэ хувьсах зардлаас өндөр байх ёстой.
        </p>
      ) : (
        <ChartContainer config={breakEvenConfig} className="h-36 w-full">
          <BarChart
            data={[
              {
                fixedCosts: result.fixedCosts,
                breakEvenRevenue: result.breakEvenRevenue,
              },
            ]}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <XAxis dataKey="fixedCosts" hide />
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
            <Bar
              dataKey="fixedCosts"
              fill="var(--color-fixedCosts)"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="breakEvenRevenue"
              fill="var(--color-breakEvenRevenue)"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );

  return <CalculatorFrame form={form} results={results} />;
}

export function DiscountCalculator() {
  const defaults = { price: "500000", discountPercent: "20" };
  const { draft, applied, setValue, apply, reset } =
    useCalculatorState(defaults);

  const result = calcDiscount({
    price: readNumber(applied, "price"),
    discountPercent: readNumber(applied, "discountPercent"),
  });

  const form = (
    <form onSubmit={apply} className="space-y-3" noValidate>
      <NumberField
        label={t("calculators.fields.price")}
        value={draft.price}
        onChange={(value) => setValue("price", value)}
      />
      <NumberField
        label={t("calculators.fields.discountPercent")}
        value={draft.discountPercent}
        onChange={(value) => setValue("discountPercent", value)}
        max={100}
      />
      <FormActions onReset={reset} />
    </form>
  );

  const results = (
    <div className="space-y-3">
      <ResultHero label={t("calculators.outputs.finalPrice")}>
        <Money amount={result.finalPrice} />
      </ResultHero>
      <div>
        <ResultRow
          label={t("calculators.outputs.discountAmount")}
          value={<Money amount={result.discountAmount} />}
        />
        <ResultRow
          label={t("calculators.fields.price")}
          value={<Money amount={result.price} />}
          muted
        />
        <ResultRow
          label={t("calculators.fields.discountPercent")}
          value={`${formatNumber(result.discountPercent, 1)}%`}
        />
      </div>
    </div>
  );

  return <CalculatorFrame form={form} results={results} />;
}
