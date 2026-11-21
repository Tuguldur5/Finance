import { z } from "zod";

import { parseAmountInput } from "@/lib/finance/format";
import { t } from "@/lib/i18n";

import { isoDateSchema, transactionTypeSchema } from "./transaction";

export const recurringFrequencySchema = z.enum([
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

export type RecurringFrequency = z.infer<typeof recurringFrequencySchema>;

function validateRecurringShape(
  value: {
    type: "income" | "expense" | "transfer";
    walletId: string;
    toWalletId?: string | null;
    categoryId?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  if (value.type === "transfer") {
    if (!value.toWalletId) {
      ctx.addIssue({
        code: "custom",
        path: ["toWalletId"],
        message: t("validation.selectWallet"),
      });
    } else if (value.toWalletId === value.walletId) {
      ctx.addIssue({
        code: "custom",
        path: ["toWalletId"],
        message: t("validation.sameWallet"),
      });
    }
  } else if (!value.categoryId) {
    ctx.addIssue({
      code: "custom",
      path: ["categoryId"],
      message: t("validation.selectCategory"),
    });
  }
}

export const recurringInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    type: transactionTypeSchema,
    amount: z
      .number()
      .finite()
      .positive({ message: t("validation.amount") })
      .max(1e15, { message: t("validation.amountTooLarge") }),
    walletId: z.string().uuid({ message: t("validation.selectWallet") }),
    toWalletId: z.string().uuid().nullish(),
    categoryId: z.string().uuid().nullish(),
    frequency: recurringFrequencySchema,
    intervalCount: z.number().int().min(1).max(12),
    nextRun: isoDateSchema,
    note: z
      .string()
      .trim()
      .max(500, { message: t("validation.noteMax") })
      .default(""),
    isActive: z.boolean().default(true),
  })
  .superRefine(validateRecurringShape);

export type RecurringInput = z.infer<typeof recurringInputSchema>;

export const recurringFormSchema = z
  .object({
    type: transactionTypeSchema,
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
    walletId: z.string().min(1, { message: t("validation.selectWallet") }),
    toWalletId: z.string(),
    categoryId: z.string(),
    frequency: recurringFrequencySchema,
    intervalCount: z
      .string()
      .trim()
      .refine(
        (raw) => /^\d+$/.test(raw) && Number(raw) >= 1 && Number(raw) <= 12,
        { message: t("validation.positiveNumber") },
      ),
    nextRun: isoDateSchema,
    note: z
      .string()
      .trim()
      .max(500, { message: t("validation.noteMax") }),
  })
  .superRefine(validateRecurringShape);

export type RecurringFormValues = z.infer<typeof recurringFormSchema>;
