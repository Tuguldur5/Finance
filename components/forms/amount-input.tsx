"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import {
  CURRENCY_DECIMALS,
  CURRENCY_SYMBOLS,
  type CurrencyCode,
} from "@/lib/config";
import { formatNumber, parseAmountInput } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

type AmountInputProps = {
  value: string;
  onChange: (value: string) => void;
  currency?: CurrencyCode;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
};

/**
 * Text input that accepts "1 234 567" / "1,234.50" and formats the value
 * with grouped digits on blur. The form keeps a string while typing.
 */
export function AmountInput({
  value,
  onChange,
  currency = "MNT",
  id,
  placeholder,
  disabled,
  className,
  ...rest
}: AmountInputProps) {
  const decimals = CURRENCY_DECIMALS[currency];

  function handleBlur() {
    const parsed = parseAmountInput(value);

    if (parsed === null) {
      onChange("");
      return;
    }

    onChange(formatNumber(parsed, decimals));
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d.,\s-]/g, "");
          onChange(next);
        }}
        onBlur={handleBlur}
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder ?? formatNumber(0, decimals)}
        disabled={disabled}
        aria-invalid={rest["aria-invalid"]}
        className={cn("tabular-nums pr-9", className)}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
        {CURRENCY_SYMBOLS[currency]}
      </span>
    </div>
  );
}
