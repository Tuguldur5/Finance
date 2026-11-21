import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/config";
import { formatMoney, type MoneyInput } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

type MoneyTone = "default" | "positive" | "negative" | "auto";

type MoneyProps = {
  amount: MoneyInput;
  currency?: CurrencyCode;
  className?: string;
  /** `auto` colors negatives red and positives green. */
  tone?: MoneyTone;
  signed?: boolean;
  decimals?: number;
  /** Shown when the amount is null/undefined/empty. */
  placeholder?: string;
};

const toneClasses: Record<Exclude<MoneyTone, "auto">, string> = {
  default: "",
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-red-600 dark:text-red-400",
};

/**
 * Renders a formatted money value with tabular numbers.
 * Use this everywhere an amount is displayed.
 */
export function Money({
  amount,
  currency = DEFAULT_CURRENCY,
  className,
  tone = "default",
  signed,
  decimals,
  placeholder = "—",
}: MoneyProps) {
  const isMissing =
    amount === null || amount === undefined || amount === "";

  if (isMissing) {
    return (
      <span className={cn("tabular-nums text-muted-foreground", className)}>
        {placeholder}
      </span>
    );
  }

  const value = typeof amount === "number" ? amount : Number(amount);
  const resolvedTone: Exclude<MoneyTone, "auto"> =
    tone === "auto"
      ? value < 0
        ? "negative"
        : value > 0
          ? "positive"
          : "default"
      : tone;

  return (
    <span
      data-money
      className={cn("tabular-nums", toneClasses[resolvedTone], className)}
    >
      {formatMoney(amount, currency, { signed, decimals })}
    </span>
  );
}
