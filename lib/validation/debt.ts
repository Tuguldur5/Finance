import { z } from "zod";

import { parseAmountInput } from "@/lib/finance/format";
import { t } from "@/lib/i18n";

import { isoDateSchema } from "./transaction";

export const debtTypeSchema = z.enum(["i_owe", "owed_to_me"]);
export type DebtType = z.infer<typeof debtTypeSchema>;

function checkDateOrder(
  value: { startDate: string; dueDate?: string | null },
  ctx: z.RefinementCtx,
) {
  if (value.dueDate && value.dueDate < value.startDate) {
    ctx.addIssue({
      code: "custom",
      path: ["dueDate"],
      message: t("validation.dateOrder"),
    });
  }
}

export const debtInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    type: debtTypeSchema,
    counterparty: z
      .string()
      .trim()
      .min(1, { message: t("validation.required") })
      .max(120, { message: t("validation.nameMax") }),
    principal: z
      .number()
      .finite()
      .positive({ message: t("validation.amount") })
      .max(1e15, { message: t("validation.amountTooLarge") }),
    interestRate: z
      .number()
      .finite()
      .min(0, { message: t("validation.rateRange") })
      .max(100, { message: t("validation.rateRange") }),
    startDate: isoDateSchema,
    dueDate: isoDateSchema.nullish(),
    note: z
      .string()
      .trim()
      .max(500, { message: t("validation.noteMax") })
      .default(""),
  })
  .superRefine(checkDateOrder);

export type DebtInput = z.infer<typeof debtInputSchema>;

export const debtFormSchema = z
  .object({
    type: debtTypeSchema,
    counterparty: z
      .string()
      .trim()
      .min(1, { message: t("validation.required") })
      .max(120, { message: t("validation.nameMax") }),
    principal: z
      .string()
      .trim()
      .min(1, { message: t("validation.required") })
      .refine(
        (raw) => {
          const value = parseAmountInput(raw);
          return value !== null && value > 0;
        },
        { message: t("validation.amount") },
      ),
    interestRate: z
      .string()
      .trim()
      .refine((raw) => {
        if (raw === "") return true;
        const value = Number(raw);
        return Number.isFinite(value) && value >= 0 && value <= 100;
      }, { message: t("validation.rateRange") }),
    startDate: isoDateSchema,
    dueDate: z.string(),
    note: z
      .string()
      .trim()
      .max(500, { message: t("validation.noteMax") }),
  })
  .superRefine(checkDateOrder);

export type DebtFormValues = z.infer<typeof debtFormSchema>;

export const debtPaymentInputSchema = z.object({
  debtId: z.string().uuid(),
  amount: z
    .number()
    .finite()
    .positive({ message: t("validation.amount") })
    .max(1e15, { message: t("validation.amountTooLarge") }),
  paidAt: isoDateSchema,
  walletId: z.string().uuid().nullish(),
  note: z
    .string()
    .trim()
    .max(500, { message: t("validation.noteMax") })
    .default(""),
});

export type DebtPaymentInput = z.infer<typeof debtPaymentInputSchema>;

export const debtPaymentFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, { message: t("validation.required") })
    .refine(
      (raw) => {
        const value = parseAmountInput(raw);
        return value !== null && value > 0;
      },
      { message: t("validation.amount") },
    ),
  paidAt: isoDateSchema,
  walletId: z.string(),
  note: z
    .string()
    .trim()
    .max(500, { message: t("validation.noteMax") }),
});

export type DebtPaymentFormValues = z.infer<typeof debtPaymentFormSchema>;
