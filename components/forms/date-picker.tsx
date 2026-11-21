"use client";

import { format, isValid, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateISO, formatDateMn, mnDateLocale } from "@/lib/date";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value: string;
  onChange: (isoDate: string) => void;
  id?: string;
  placeholder: string;
  disabled?: boolean;
  className?: string;
};

/** Single-date picker returning `yyyy-MM-dd`. */
export function DatePicker({
  value,
  onChange,
  id,
  placeholder,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const parsed = value ? parseISO(value) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          <span className="truncate">
            {selected ? formatDateMn(selected) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={mnDateLocale}
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(formatDateISO(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

type DateRangePickerProps = {
  from?: string;
  to?: string;
  onChange: (range: { from?: string; to?: string }) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
};

function parseRangeValue(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

/** Range picker used by the transaction filters. */
export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder,
  disabled,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = {
    from: parseRangeValue(from),
    to: parseRangeValue(to),
  };
  const hasRange = Boolean(selected.from || selected.to);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start font-normal",
            !hasRange && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          <span className="truncate">
            {selected.from && selected.to
              ? `${format(selected.from, "yyyy.MM.dd")} – ${format(selected.to, "yyyy.MM.dd")}`
              : selected.from
                ? `${format(selected.from, "yyyy.MM.dd")} – …`
                : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          locale={mnDateLocale}
          numberOfMonths={1}
          selected={selected}
          defaultMonth={selected.from}
          onSelect={(range) => {
            onChange({
              from: range?.from ? formatDateISO(range.from) : undefined,
              to: range?.to ? formatDateISO(range.to) : undefined,
            });
            if (range?.from && range?.to) setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
