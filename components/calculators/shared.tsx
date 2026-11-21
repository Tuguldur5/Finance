"use client";

import { Link2, RotateCcw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type CalcValues = Record<string, string>;

/** 1,234,567 -> "1.2сая" for compact chart axes. */
export function compactMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${formatNumber(value / 1_000_000_000, 1)}тэрбум`;
  if (abs >= 1_000_000) return `${formatNumber(value / 1_000_000, 1)}сая`;
  if (abs >= 10_000) return `${formatNumber(value / 1_000, 0)}мян`;
  return formatNumber(value);
}

function readParams<T extends CalcValues>(defaults: T, params: URLSearchParams): T {
  const merged = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const value = params.get(String(key));
    if (value !== null && value !== "") merged[key] = value as T[keyof T];
  }
  return merged;
}

/**
 * Form state for a calculator. Draft values are edited in the form; applied
 * values drive the results and are mirrored into the URL query string so the
 * calculation can be shared.
 */
export function useCalculatorState<T extends CalcValues>(defaults: T) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [draft, setDraft] = React.useState<T>(() =>
    readParams(defaults, searchParams),
  );
  const [applied, setApplied] = React.useState<T>(draft);

  function setValue<K extends keyof T>(key: K, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function apply(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setApplied({ ...draft });

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(draft)) {
      if (value !== "") params.set(key, value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function reset() {
    setDraft({ ...defaults });
    setApplied({ ...defaults });
    router.replace(pathname, { scroll: false });
  }

  return { draft, applied, setValue, apply, reset };
}

export function readNumber(
  values: CalcValues,
  key: string,
  fallback = 0,
): number {
  const parsed = Number(values[key]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

type NumberFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number | string;
  hint?: string;
};

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max,
  step = "any",
  hint,
}: NumberFieldProps) {
  const id = React.useId();

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn("tabular-nums", suffix && "pr-10")}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function ResultRow({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b py-1.5 text-xs last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "tabular-nums",
          strong && "text-sm font-semibold",
          muted && "text-muted-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function ResultHero({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums">{children}</p>
      {hint ? (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function CalculatorFrame({
  form,
  results,
  note,
}: {
  form: React.ReactNode;
  results: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="gap-0 py-4">
          <CardHeader className="px-4 pb-3">
            <CardTitle className="text-sm font-medium">
              {t("calculators.inputs")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">{form}</CardContent>
        </Card>

        <Card className="gap-0 py-4">
          <CardHeader className="px-4 pb-3">
            <CardTitle className="text-sm font-medium">
              {t("calculators.results")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">{results}</CardContent>
        </Card>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {note ?? t("calculators.note")}
      </p>
    </div>
  );
}

export function FormActions({
  onReset,
  disabled,
}: {
  onReset: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <Button type="button" variant="ghost" size="sm" onClick={onReset}>
        <RotateCcw className="size-3.5" />
        {t("calculators.reset")}
      </Button>
      <Button type="submit" size="sm" disabled={disabled}>
        {t("calculators.calculate")}
      </Button>
    </div>
  );
}

export function ShareButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast.success(t("calculators.copied"));
        } catch {
          toast.error(t("errors.generic"));
        }
      }}
    >
      <Link2 className="size-4" />
      {t("calculators.share")}
    </Button>
  );
}
