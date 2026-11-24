"use client";

import { Money } from "@/components/money";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calcSalary, type SalaryMode } from "@/lib/calculators/salary";
import { calcVat, type VatMode } from "@/lib/calculators/vat";
import { formatNumber } from "@/lib/finance/format";
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

export function SalaryCalculator() {
  const defaults = { mode: "gross", amount: "2000000" };
  const { draft, applied, setValue, apply, reset } =
    useCalculatorState(defaults);

  const result = calcSalary({
    amount: readNumber(applied, "amount"),
    mode: (applied.mode === "net" ? "net" : "gross") as SalaryMode,
  });

  const form = (
    <form onSubmit={apply} className="space-y-3" noValidate>
      <Tabs
        value={draft.mode}
        onValueChange={(value) => setValue("mode", value)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gross">
            {t("calculators.salaryModes.gross")}
          </TabsTrigger>
          <TabsTrigger value="net">
            {t("calculators.salaryModes.net")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <NumberField
        label={
          draft.mode === "net"
            ? t("calculators.fields.netAmount")
            : t("calculators.fields.amount")
        }
        value={draft.amount}
        onChange={(value) => setValue("amount", value)}
        format="money"
      />

      <FormActions onReset={reset} />
    </form>
  );

  const results = (
    <div className="space-y-3">
      <ResultHero
        label={t("calculators.outputs.annualNet")}
        hint={`${t("calculators.outputs.annualGross")}: ${new Intl.NumberFormat("en-US").format(result.annualGross)}₮`}
      >
        <Money amount={result.annualNet} />
      </ResultHero>

      <div>
        <ResultRow
          label={t("common.gross")}
          value={<Money amount={result.gross} />}
          strong
        />
        <ResultRow
          label={t("calculators.outputs.socialInsurance")}
          value={<Money amount={result.socialInsurance} />}
        />
        <ResultRow
          label={t("calculators.outputs.taxableIncome")}
          value={<Money amount={result.taxableIncome} />}
          muted
        />
        <ResultRow
          label={t("calculators.outputs.incomeTax")}
          value={<Money amount={result.incomeTax} />}
        />
        <ResultRow
          label={t("calculators.outputs.totalDeductions")}
          value={<Money amount={result.totalDeductions} />}
          muted
        />
        <ResultRow
          label={t("common.net")}
          value={<Money amount={result.net} />}
          strong
        />
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {t("calculators.outputs.socialInsurance")} — 11.5%, ХХОАТ — 10%,
        сарын хөнгөлөлт 20,000₮.
      </p>
    </div>
  );

  return (
    <CalculatorFrame
      form={form}
      results={results}
      note={t("calculators.taxNote")}
      summary={{
        label: t("calculators.outputs.annualNet"),
        value: <Money amount={result.annualNet} />,
      }}
    />
  );
}

export function VatCalculator() {
  const defaults = { amount: "1000000", rate: "10", mode: "add" };
  const { draft, applied, setValue, apply, reset } =
    useCalculatorState(defaults);

  const result = calcVat({
    amount: readNumber(applied, "amount"),
    rate: readNumber(applied, "rate"),
    mode: (applied.mode === "remove" ? "remove" : "add") as VatMode,
  });

  const form = (
    <form onSubmit={apply} className="space-y-3" noValidate>
      <Tabs
        value={draft.mode}
        onValueChange={(value) => setValue("mode", value)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add">
            {t("calculators.vatModes.add")}
          </TabsTrigger>
          <TabsTrigger value="remove">
            {t("calculators.vatModes.remove")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <NumberField
        label={t("calculators.fields.amount")}
        value={draft.amount}
        onChange={(value) => setValue("amount", value)}
        format="money"
      />
      <NumberField
        label={t("calculators.fields.rate")}
        value={draft.rate}
        onChange={(value) => setValue("rate", value)}
        format="percent"
      />

      <FormActions onReset={reset} />
    </form>
  );

  const results = (
    <div className="space-y-3">
      <ResultHero
        label={
          applied.mode === "remove"
            ? t("calculators.outputs.netAmount")
            : t("calculators.outputs.grossAmount")
        }
      >
        <Money amount={applied.mode === "remove" ? result.net : result.gross} />
      </ResultHero>

      <div>
        <ResultRow
          label={t("calculators.outputs.netAmount")}
          value={<Money amount={result.net} />}
        />
        <ResultRow
          label={t("calculators.outputs.vatAmount")}
          value={<Money amount={result.vat} />}
        />
        <ResultRow
          label={t("calculators.outputs.grossAmount")}
          value={<Money amount={result.gross} />}
          strong
        />
        <ResultRow
          label={t("calculators.fields.rate")}
          value={`${formatNumber(result.rate, 1)}%`}
          muted
        />
      </div>
    </div>
  );

  return (
    <CalculatorFrame
      form={form}
      results={results}
      note={t("calculators.taxNote")}
      summary={{
        label:
          applied.mode === "remove"
            ? t("calculators.outputs.netAmount")
            : t("calculators.outputs.grossAmount"),
        value: (
          <Money amount={applied.mode === "remove" ? result.net : result.gross} />
        ),
      }}
    />
  );
}
