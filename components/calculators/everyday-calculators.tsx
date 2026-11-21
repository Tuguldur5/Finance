"use client";

import { BookmarkPlus, Check, Trash2 } from "lucide-react";
import * as React from "react";
import { Cell, Pie, PieChart } from "recharts";
import { toast } from "sonner";

import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
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
import { calcBudgetSplit } from "@/lib/calculators/budget";
import { convertCurrency } from "@/lib/calculators/currency";
import {
  SUPPORTED_CURRENCIES,
  isCurrencyCode,
  type CurrencyCode,
} from "@/lib/config";
import { formatDateShort, todayISO } from "@/lib/date";
import { formatMoney, formatNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";

import {
  CalculatorFrame,
  FormActions,
  NumberField,
  ResultHero,
  ResultRow,
  readNumber,
  useCalculatorState,
} from "./shared";

const RATE_STORAGE_KEY = "sankhuu:fx-rates";

type StoredRate = {
  code: string;
  rate: number;
  updatedAt: string;
};

function readStoredRates(): StoredRate[] {
  try {
    const raw = window.localStorage.getItem(RATE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is StoredRate =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as StoredRate).code === "string" &&
        typeof (entry as StoredRate).rate === "number" &&
        typeof (entry as StoredRate).updatedAt === "string",
    );
  } catch {
    return [];
  }
}

function useStoredRates() {
  const [rates, setRates] = React.useState<StoredRate[]>([]);

  React.useEffect(() => {
    setRates(readStoredRates());
  }, []);

  function persist(next: StoredRate[]) {
    setRates(next);
    window.localStorage.setItem(RATE_STORAGE_KEY, JSON.stringify(next));
  }

  function save(rate: StoredRate) {
    const next = [rate, ...rates.filter((entry) => entry.code !== rate.code)];
    persist(next);
    toast.success(t("calculators.currency.rateSaved"));
  }

  function remove(code: string) {
    persist(rates.filter((entry) => entry.code !== code));
  }

  return { rates, save, remove };
}

const budgetConfig = {
  needs: { label: t("calculators.outputs.needs"), color: "var(--chart-1)" },
  wants: { label: t("calculators.outputs.wants"), color: "var(--chart-3)" },
  savings: { label: t("calculators.outputs.savings"), color: "var(--chart-2)" },
} satisfies ChartConfig;

function CurrencySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CURRENCIES.map((code) => (
            <SelectItem key={code} value={code}>
              {code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CurrencyCalculator() {
  const defaults = {
    amount: "100",
    rate: "3400",
    fromCurrency: "USD",
    toCurrency: "MNT",
  };
  const { draft, applied, setValue, apply, reset } =
    useCalculatorState(defaults);
  const { rates, save, remove } = useStoredRates();

  const result = convertCurrency({
    amount: readNumber(applied, "amount"),
    rate: readNumber(applied, "rate"),
  });

  const toCurrency: CurrencyCode = isCurrencyCode(applied.toCurrency)
    ? applied.toCurrency
    : "MNT";

  const form = (
    <form onSubmit={apply} className="space-y-3" noValidate>
      <NumberField
        label={t("calculators.fields.amount")}
        value={draft.amount}
        onChange={(value) => setValue("amount", value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <CurrencySelect
          label={t("calculators.fields.fromCurrency")}
          value={draft.fromCurrency}
          onChange={(value) => setValue("fromCurrency", value)}
        />
        <CurrencySelect
          label={t("calculators.fields.toCurrency")}
          value={draft.toCurrency}
          onChange={(value) => setValue("toCurrency", value)}
        />
      </div>

      <NumberField
        label={t("calculators.fields.manualRate")}
        value={draft.rate}
        onChange={(value) => setValue("rate", value)}
        hint={`1 ${draft.fromCurrency} = ${draft.rate || "0"} ${draft.toCurrency}`}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const rate = readNumber(draft, "rate");
            if (!isCurrencyCode(draft.toCurrency) || rate <= 0) return;
            save({
              code: draft.toCurrency,
              rate,
              updatedAt: todayISO(),
            });
          }}
        >
          <BookmarkPlus className="size-4" />
          {t("calculators.currency.saveRate")}
        </Button>
      </div>

      <FormActions onReset={reset} />
    </form>
  );

  const results = (
    <div className="space-y-3">
      <ResultHero
        label={t("calculators.outputs.converted")}
        hint={`1 ${applied.fromCurrency} = ${formatNumber(result.rate, 4)} ${applied.toCurrency}`}
      >
        <Money amount={result.converted} currency={toCurrency} />
      </ResultHero>

      <ResultRow
        label={t("calculators.outputs.inverseRate")}
        value={`1 ${applied.toCurrency} = ${formatNumber(result.inverseRate, 4)} ${applied.fromCurrency}`}
      />

      <div>
        <h3 className="mb-1 text-xs font-medium">
          {t("calculators.currency.savedRates")}
        </h3>

        {rates.length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground">
            {t("calculators.currency.noSavedRates")}
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("calculators.fields.currency")}</TableHead>
                  <TableHead className="text-right">
                    {t("calculators.fields.rate")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("calculators.currency.updated")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("common.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((entry) => (
                  <TableRow key={entry.code}>
                    <TableCell className="text-xs font-medium">
                      {entry.code}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {formatNumber(entry.rate, 2)}
                    </TableCell>
                    <TableCell className="text-right text-[11px] text-muted-foreground">
                      {formatDateShort(entry.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("calculators.currency.use")}
                          onClick={() => {
                            setValue("toCurrency", entry.code);
                            setValue("rate", String(entry.rate));
                          }}
                        >
                          <Check className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("calculators.currency.remove")}
                          onClick={() => remove(entry.code)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );

  return <CalculatorFrame form={form} results={results} />;
}

export function BudgetCalculator() {
  const defaults = { income: "3000000" };
  const { draft, applied, setValue, apply, reset } =
    useCalculatorState(defaults);

  const result = calcBudgetSplit(readNumber(applied, "income"));

  const pieData = [
    { name: t("calculators.outputs.needs"), value: result.needs, fill: "var(--chart-1)" },
    { name: t("calculators.outputs.wants"), value: result.wants, fill: "var(--chart-3)" },
    { name: t("calculators.outputs.savings"), value: result.savings, fill: "var(--chart-2)" },
  ];

  const form = (
    <form onSubmit={apply} className="space-y-3" noValidate>
      <NumberField
        label={t("calculators.fields.income")}
        value={draft.income}
        onChange={(value) => setValue("income", value)}
      />
      <FormActions onReset={reset} />
    </form>
  );

  const results = (
    <div className="space-y-3">
      <ResultHero label={t("calculators.outputs.savings")}>
        <Money amount={result.savings} />
      </ResultHero>

      <div>
        <ResultRow
          label={t("calculators.outputs.needs")}
          value={<Money amount={result.needs} />}
        />
        <ResultRow
          label={t("calculators.outputs.wants")}
          value={<Money amount={result.wants} />}
        />
        <ResultRow
          label={t("calculators.outputs.savings")}
          value={<Money amount={result.savings} />}
          strong
        />
      </div>

      <ChartContainer config={budgetConfig} className="mx-auto h-40 w-full max-w-56">
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
    </div>
  );

  return <CalculatorFrame form={form} results={results} />;
}
