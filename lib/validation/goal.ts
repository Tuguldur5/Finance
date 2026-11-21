import { z } from "zod";

import { parseAmountInput } from "@/lib/finance/format";
import { t } from "@/lib/i18n";

import { isoDateSchema } from "./transaction";

const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, { message: t("validation.invalidInput") });

export const goalInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, { message: t("validation.required") })
    .max(120, { message: t("validation.nameMax") }),
  targetAmount: z
    .number()
    .finite()
    .positive({ message: t("validation.amount") })
    .max(1e15, { message: t("validation.amountTooLarge") }),
  targetDate: isoDateSchema.nullish(),
  color: colorSchema,
});

export type GoalInput = z.infer<typeof goalInputSchema>;

export const goalFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: t("validation.required") })
    .max(120, { message: t("validation.nameMax") }),
  targetAmount: z
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
  targetDate: z.string(),
  color: colorSchema,
});

export type GoalFormValues = z.infer<typeof goalFormSchema>;

export const contributionInputSchema = z.object({
  goalId: z.string().uuid(),
  amount: z
    .number()
    .finite()
    .positive({ message: t("validation.amount") })
    .max(1e15, { message: t("validation.amountTooLarge") }),
  contributedAt: isoDateSchema,
  walletId: z.string().uuid().nullish(),
  note: z
    .string()
    .trim()
    .max(500, { message: t("validation.noteMax") })
    .default(""),
});

export type ContributionInput = z.infer<typeof contributionInputSchema>;

export const contributionFormSchema = z.object({
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
  contributedAt: isoDateSchema,
  walletId: z.string(),
  note: z
    .string()
    .trim()
    .max(500, { message: t("validation.noteMax") }),
});

export type ContributionFormValues = z.infer<typeof contributionFormSchema>;
