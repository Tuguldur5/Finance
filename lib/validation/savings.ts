import { z } from "zod";

import { parseAmountInput } from "@/lib/finance/format";
import { t } from "@/lib/i18n";

import { isoDateSchema } from "./transaction";

const savingsTypeSchema = z.enum([
  "savings",
  "investment",
  "bond",
  "stock",
  "other",
]);

const liquiditySchema = z.enum(["instant", "term", "long_term"]);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { message: t("validation.nameMax") })
    .default("");

export const savingsAccountInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, { message: t("validation.required") })
    .max(120, { message: t("validation.nameMax") }),
  type: savingsTypeSchema,
  institution: optionalText(120),
  balance: z
    .number()
    .finite()
    .min(0, { message: t("validation.amount") })
    .max(1e15, { message: t("validation.amountTooLarge") }),
  expectedRate: z
    .number()
    .finite()
    .min(0, { message: t("validation.invalidInput") })
    .max(1000, { message: t("validation.invalidInput") }),
  liquidity: liquiditySchema,
  maturityDate: isoDateSchema.nullish(),
  note: optionalText(500),
});

export type SavingsAccountInput = z.infer<typeof savingsAccountInputSchema>;

export const savingsAccountFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: t("validation.required") })
    .max(120, { message: t("validation.nameMax") }),
  type: savingsTypeSchema,
  institution: z
    .string()
    .trim()
    .max(120, { message: t("validation.nameMax") }),
  balance: z
    .string()
    .trim()
    .min(1, { message: t("validation.required") })
    .refine(
      (raw) => {
        const value = parseAmountInput(raw);
        return value !== null && value >= 0;
      },
      { message: t("validation.amount") },
    ),
  expectedRate: z
    .string()
    .trim()
    .refine(
      (raw) => raw === "" || (Number.isFinite(Number(raw)) && Number(raw) >= 0),
      { message: t("validation.invalidInput") },
    ),
  liquidity: liquiditySchema,
  maturityDate: z.string(),
  note: z
    .string()
    .trim()
    .max(500, { message: t("validation.noteMax") }),
});

export type SavingsAccountFormValues = z.infer<
  typeof savingsAccountFormSchema
>;

export const savingsAdjustmentInputSchema = z.object({
  id: z.string().uuid(),
  amount: z
    .number()
    .finite()
    .positive({ message: t("validation.amount") })
    .max(1e15, { message: t("validation.amountTooLarge") }),
  direction: z.enum(["deposit", "withdraw"]),
});

export type SavingsAdjustmentInput = z.infer<
  typeof savingsAdjustmentInputSchema
>;

export const savingsAdjustmentFormSchema = z.object({
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
});

export type SavingsAdjustmentFormValues = z.infer<
  typeof savingsAdjustmentFormSchema
>;
