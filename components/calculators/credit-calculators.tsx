"use client";

import { Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calcCredit, calcMortgage } from "@/lib/calculators/credit";
import { formatMoney } from "@/lib/finance/format";
import { todayISO } from "@/lib/date";
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

const balanceConfig = {
  balance: {
    label: t("calculators.table.balance"),
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const mortgageConfig = {
  principal: { label: t("calculators.table.principal"), color: "var(--chart-1)" },
  interest: { label: t("calculators.table.interest"), color: "var(--chart-5)" },
} satisfies ChartConfig;

function YearlyChart({
  data,
  dataKey = "balance",
  config = balanceConfig,
}: {
  data: { year: number; balance: number }[];
  dataKey?: string;
  config?: ChartConfig;
}) {
  if (data.length < 2) return null;

  return (
    <ChartContainer config={config} className="mt-3 h-40 w-full">
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
          dataKey={dataKey}
          stroke="var(--color-balance)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function LoanCalculator() {
  const defaults = {
    principal: "10000000",
    annualRate: "12",
    termMonths: "24",
    paymentType: "annuity",
  };
  const { draft, applied, setValue, apply, reset } =
    useCalculatorState(defaults);

  const result = calcCredit({
    principal: readNumber(applied, "principal"),
    annualRate: readNumber(applied, "annualRate"),
    termMonths: readNumber(applied, "termMonths"),
    paymentType:
      applied.paymentType === "equal_principal" ? "equal_principal" : "annuity",
    startDate: todayISO(),
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
          label={t("calculators.fields.termMonths")}
          value={draft.termMonths}
          onChange={(value) => setValue("termMonths", value)}
          min={1}
          max={600}
          step={1}
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

  const results = (
    <div className="space-y-3">
      <ResultHero label={t("calculators.outputs.monthlyPayment")}>
        <Money amount={result.monthlyPayment} />
      </ResultHero>

      <div>
        <ResultRow
          label={t("calculators.outputs.loanAmount")}
          value={<Money amount={result.loanAmount} />}
        />
        <ResultRow
          label={t("calculators.outputs.totalPayment")}
          value={<Money amount={result.totalPayment} />}
        />
        <ResultRow
          label={t("calculators.outputs.totalInterest")}
          value={<Money amount={result.totalInterest} />}
          muted
        />
      </div>

      <YearlyChart data={result.yearly} />

      {result.yearly.length > 0 ? (
        <div className="max-h-48 overflow-auto rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>{t("calculators.table.year")}</TableHead>
                <TableHead className="text-right">
                  {t("calculators.table.principal")}
                </TableHead>
                <TableHead className="text-right">
                  {t("calculators.table.interest")}
                </TableHead>
                <TableHead className="text-right">
                  {t("calculators.table.balance")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.yearly.map((row) => (
                <TableRow key={row.year}>
                  <TableCell className="text-xs tabular-nums">
                    {row.year}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    <Money amount={row.principal} />
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                    <Money amount={row.interest} />
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    <Money amount={row.balance} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t("reports.noData")}
        </p>
      )}
    </div>
  );

  return <CalculatorFrame form={form} results={results} />;
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

  const result = calcMortgage({
    propertyPrice: readNumber(applied, "propertyPrice"),
    downPayment: readNumber(applied, "downPayment"),
    annualRate: readNumber(applied, "annualRate"),
    termYears: readNumber(applied, "termYears"),
    startDate: todayISO(),
  });

  const principalPart = result.loanAmount;
  const pieData = [
    { name: t("calculators.table.principal"), value: principalPart, fill: "var(--chart-1)" },
    { name: t("calculators.table.interest"), value: result.totalInterest, fill: "var(--chart-5)" },
  ];

  const form = (
    <form onSubmit={apply} className="space-y-3" noValidate>
      <NumberField
        label={t("calculators.fields.propertyPrice")}
        value={draft.propertyPrice}
        onChange={(value) => setValue("propertyPrice", value)}
      />
      <NumberField
        label={t("calculators.fields.downPayment")}
        value={draft.downPayment}
        onChange={(value) => setValue("downPayment", value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t("calculators.fields.annualRate")}
          value={draft.annualRate}
          onChange={(value) => setValue("annualRate", value)}
        />
        <NumberField
          label={t("calculators.fields.termYears")}
          value={draft.termYears}
          onChange={(value) => setValue("termYears", value)}
          min={1}
          max={50}
          step={1}
        />
      </div>
      <FormActions onReset={reset} />
    </form>
  );

  const results = (
    <div className="space-y-3">
      <ResultHero
        label={t("calculators.outputs.monthlyPayment")}
        hint={`${t("calculators.outputs.downPaymentPercent")}: ${result.downPaymentPercent}%`}
      >
        <Money amount={result.monthlyPayment} />
      </ResultHero>

      <div>
        <ResultRow
          label={t("calculators.outputs.loanAmount")}
          value={<Money amount={result.loanAmount} />}
        />
        <ResultRow
          label={t("calculators.fields.downPayment")}
          value={<Money amount={result.downPayment} />}
          muted
        />
        <ResultRow
          label={t("calculators.outputs.totalInterest")}
          value={<Money amount={result.totalInterest} />}
        />
        <ResultRow
          label={t("calculators.outputs.totalPayment")}
          value={<Money amount={result.totalPayment} />}
          strong
        />
      </div>

      {principalPart > 0 || result.totalInterest > 0 ? (
        <ChartContainer config={mortgageConfig} className="mx-auto h-40 w-full max-w-56">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="name"
                  formatter={(value) => formatMoney(Number(value))}
                />
              }
            />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={44}
              outerRadius={68}
              paddingAngle={2}
              strokeWidth={0}
            >
              {pieData.map((row) => (
                <Cell key={row.name} fill={row.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      ) : null}
    </div>
  );

  return <CalculatorFrame form={form} results={results} />;
}
