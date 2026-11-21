import { z } from "zod";

import { parseAmountInput } from "@/lib/finance/format";
import { t } from "@/lib/i18n";

export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-01$/, { message: t("validation.invalidMonth") });

export const budgetInputSchema = z.object({
  categoryId: z.string().uuid({ message: t("validation.selectCategory") }),
  month: monthSchema,
  amount: z
    .number()
    .finite()
    .positive({ message: t("validation.amount") })
    .max(1e15, { message: t("validation.amountTooLarge") }),
});

export type BudgetInput = z.infer<typeof budgetInputSchema>;

export const budgetFormSchema = z.object({
  categoryId: z.string().min(1, { message: t("validation.selectCategory") }),
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

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
