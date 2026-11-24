"use client";

import { Link2, RotateCcw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber, parseAmountInput } from "@/lib/finance/format";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type CalcValues = Record<string, string>;

export type FieldFormat = "money" | "percent" | "months" | "years" | "plain";

export { compactMoney } from "@/lib/finance/format";

function readParams<T extends CalcValues>(defaults: T, params: URLSearchParams): T {
  const merged = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const value = params.get(String(key));
    if (value !== null && value !== "") merged[key] = value as T[keyof T];
  }
  return merged;
}

function toQuery(values: CalcValues): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== "") params.set(key, value);
  }
  return params.toString();
}

/**
 * Form state for a calculator. Results update on every keystroke and the
 * shareable query string is written with `router.replace`, debounced by 300ms
 * so typing does not spam the history or the network.
 */
export function useCalculatorState<T extends CalcValues>(defaults: T) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [values, setValues] = React.useState<T>(() =>
    readParams(defaults, searchParams),
  );
  const [applied, setApplied] = React.useState<T>(values);
  const dirty = React.useRef(false);

  // Results follow typing with a short delay so a loan schedule is not rebuilt
  // on every keypress. The query string uses the same cadence.
  React.useEffect(() => {
    const timer = window.setTimeout(() => setApplied(values), 150);
    return () => window.clearTimeout(timer);
  }, [values]);

  React.useEffect(() => {
    if (!dirty.current) return;

    const timer = window.setTimeout(() => {
      const query = toQuery(values);
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [values, pathname, router]);

  function setValue<K extends keyof T>(key: K, value: string) {
    dirty.current = true;
    setValues((current) => ({ ...current, [key]: value }));
  }

  function apply(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    dirty.current = true;
    setApplied(values);

    const query = toQuery(values);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function reset() {
    dirty.current = false;
    setValues({ ...defaults });
    setApplied({ ...defaults });
    router.replace(pathname, { scroll: false });
  }

  return { draft: values, applied, setValue, apply, reset };
}

export function readNumber(
  values: CalcValues,
  key: string,
  fallback = 0,
): number {
  const raw = values[key];
  if (raw === undefined || raw.trim() === "") return fallback;

  const direct = Number(raw);
  if (Number.isFinite(direct)) return direct;

  // Grouped money ("10,000,000") arrives from pasted/shareable URLs.
  return parseAmountInput(raw) ?? fallback;
}

const FIELD_SUFFIX: Partial<Record<FieldFormat, string>> = {
  money: "₮",
  percent: "%",
  months: t("calculators.units.monthShort"),
  years: t("calculators.units.yearShort"),
};

function formatFieldValue(value: string, format: FieldFormat): string {
  if (format !== "money" || value === "") return value;

  const digits = value.replace(/[^\d]/g, "");
  if (digits === "") return "";
  return formatNumber(Number(digits));
}

function caretFromDigits(display: string, digitsBefore: number): number {
  if (digitsBefore <= 0) return 0;

  let seen = 0;
  for (let index = 0; index < display.length; index += 1) {
    if (/\d/.test(display[index])) seen += 1;
    if (seen === digitsBefore) return index + 1;
  }

  return display.length;
}

type NumberFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Unit shown inside the input; defaults to the format's unit. */
  suffix?: string;
  format?: FieldFormat;
  min?: number;
  max?: number;
  hint?: string;
};

/**
 * Numeric form field with a unit suffix. Money values are grouped with
 * thousands separators while typing; the caret keeps its digit position.
 */
export function NumberField({
  label,
  value,
  onChange,
  suffix,
  format = "plain",
  hint,
}: NumberFieldProps) {
  const id = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const caretDigits = React.useRef<number | null>(null);

  const display = formatFieldValue(value, format);
  const resolvedSuffix = suffix ?? FIELD_SUFFIX[format];

  React.useLayoutEffect(() => {
    if (caretDigits.current === null) return;

    const input = inputRef.current;
    if (!input) return;

    const position = caretFromDigits(display, caretDigits.current);
    input.setSelectionRange(position, position);
    caretDigits.current = null;
  }, [display]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;

    if (format === "money") {
      const caret = event.target.selectionStart ?? raw.length;
      const digitsBefore = raw.slice(0, caret).replace(/[^\d]/g, "").length;
      caretDigits.current = digitsBefore;
      onChange(raw.replace(/[^\d]/g, ""));
      return;
    }

    if (format === "percent") {
      const cleaned = raw
        .replace(/[^\d.]/g, "")
        .replace(/(\..*)\./g, "$1");
      onChange(cleaned);
      return;
    }

    if (format === "months" || format === "years") {
      onChange(raw.replace(/[^\d]/g, ""));
      return;
    }

    onChange(raw.replace(/[^\d.-]/g, ""));
  }

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          inputMode={format === "percent" ? "decimal" : "numeric"}
          value={display}
          onChange={handleChange}
          onFocus={(event) => {
            if (format === "money") {
              const position = event.currentTarget.value.length;
              event.currentTarget.setSelectionRange(position, position);
            }
          }}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(
            "h-9 tabular-nums",
            resolvedSuffix ? "pr-10" : undefined,
          )}
        />
        {resolvedSuffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {resolvedSuffix}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-[11px] text-muted-foreground">
          {hint}
        </p>
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
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2 text-xs last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-right tabular-nums",
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
  hint?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
        {children}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export type CalculationSummary = {
  label: string;
  value: React.ReactNode;
};

export function CalculatorFrame({
  form,
  results,
  note,
  summary,
}: {
  form: React.ReactNode;
  results: React.ReactNode;
  /** Disclaimer pinned to the bottom of the results panel. */
  note?: string;
  /** Main number for the sticky mobile chip. */
  summary?: CalculationSummary;
}) {
  return (
    <div className={summary ? "pb-16 lg:pb-0" : undefined}>
      <div className="grid items-start gap-4 lg:grid-cols-12">
        <section className="rounded-lg border bg-card p-4 sm:p-5 lg:col-span-5">
          <h2 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("calculators.inputs")}
          </h2>
          {form}
        </section>

        <section className="scrollbar-thin rounded-lg border bg-card p-4 sm:p-5 lg:sticky lg:top-[88px] lg:col-span-7 lg:max-h-[calc(100vh-104px)] lg:overflow-y-auto">
          <h2 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("calculators.results")}
          </h2>
          {results}
          {note ? (
            <p className="mt-4 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
              {note}
            </p>
          ) : null}
        </section>
      </div>

      {summary ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {summary.label}
            </span>
            <span className="text-lg font-semibold tabular-nums">
              {summary.value}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FormActions({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex justify-end pt-1">
      <Button type="button" variant="ghost" size="sm" onClick={onReset}>
        <RotateCcw className="size-3.5" />
        {t("calculators.reset")}
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
