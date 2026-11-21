import type { Locale } from "date-fns";
import {
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfWeek,
} from "date-fns";
import { mn as dateFnsMn } from "date-fns/locale/mn";

import { APP_TIME_ZONE, WEEK_STARTS_ON } from "@/lib/config";

/**
 * Mongolian date helpers.
 *
 * date-fns has no reliable `mn` locale in every bundle, so month and
 * weekday names are defined here explicitly. Week starts on Monday.
 */

export type DateInput = Date | string | number;

/** date-fns Mongolian locale with Monday as the first weekday. */
export const mnDateLocale: Locale = {
  ...dateFnsMn,
  options: { ...dateFnsMn.options, weekStartsOn: 1 },
};

/** Full month names, 1-indexed access through `monthNameMn`. */
export const MN_MONTHS = [
  "1-р сар",
  "2-р сар",
  "3-р сар",
  "4-р сар",
  "5-р сар",
  "6-р сар",
  "7-р сар",
  "8-р сар",
  "9-р сар",
  "10-р сар",
  "11-р сар",
  "12-р сар",
] as const;

/** Weekday names, Monday first. */
export const MN_WEEKDAYS = [
  "Даваа",
  "Мягмар",
  "Лхагва",
  "Пүрэв",
  "Баасан",
  "Бямба",
  "Ням",
] as const;

/** Short weekday names, Monday first. */
export const MN_WEEKDAYS_SHORT = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"] as const;

/** Convert an ISO string / timestamp / Date into a valid Date. */
export function toDate(value: DateInput): Date {
  const date = value instanceof Date ? value : typeof value === "number" ? new Date(value) : parseISO(value);
  return date;
}

export function isValidDate(value: DateInput): boolean {
  return isValid(toDate(value));
}

/** `2026-11-19` — the canonical storage/query format. */
export function formatDateISO(value: DateInput): string {
  return format(toDate(value), "yyyy-MM-dd");
}

/** `2026.11.19` — compact numeric display. */
export function formatDateShort(value: DateInput): string {
  return format(toDate(value), "yyyy.MM.dd");
}

/** `2026 оны 11 сар 19` — natural Mongolian display. */
export function formatDateMn(value: DateInput): string {
  return format(toDate(value), "yyyy 'оны' M 'сар' d");
}

/** `2026 оны 11 сар` — month heading. */
export function formatMonthMn(value: DateInput): string {
  return format(toDate(value), "yyyy 'оны' M 'сар'");
}

/** `11-р сар` — short month label for charts. */
export function formatMonthNameMn(value: DateInput): string {
  return MN_MONTHS[toDate(value).getMonth()] ?? "";
}

/** `2026-11` — used to key budgets by month. */
export function formatMonthKey(value: DateInput): string {
  return format(toDate(value), "yyyy-MM");
}

/** `2026 оны 11 сар 19, 14:05` */
export function formatDateTimeMn(value: DateInput): string {
  return format(toDate(value), "yyyy 'оны' M 'сар' d, HH:mm");
}

/** `14:05` */
export function formatTime(value: DateInput): string {
  return format(toDate(value), "HH:mm");
}

/** `Да` for Monday … `Ня` for Sunday. */
export function weekdayShortMn(value: DateInput): string {
  const date = toDate(value);
  const mondayFirstIndex = (date.getDay() + 6) % 7;
  return MN_WEEKDAYS_SHORT[mondayFirstIndex];
}

/** `Даваа` … `Ням`. */
export function weekdayLongMn(value: DateInput): string {
  const date = toDate(value);
  const mondayFirstIndex = (date.getDay() + 6) % 7;
  return MN_WEEKDAYS[mondayFirstIndex];
}

export function startOfWeekMn(value: DateInput): Date {
  return startOfWeek(toDate(value), { weekStartsOn: WEEK_STARTS_ON });
}

export function endOfWeekMn(value: DateInput): Date {
  return endOfWeek(toDate(value), { weekStartsOn: WEEK_STARTS_ON });
}

/** Today as `yyyy-MM-dd` in Asia/Ulaanbatar, regardless of server TZ. */
export function todayISO(timeZone = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Start and end of the current month as ISO dates. */
export function currentMonthRange(reference: DateInput = new Date()): {
  from: string;
  to: string;
} {
  const date = toDate(reference);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { from: formatDateISO(start), to: formatDateISO(end) };
}
