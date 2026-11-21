import { z } from "zod";

import { parseAmountInput } from "@/lib/finance/format";
import { t } from "@/lib/i18n";

import { isoDateSchema } from "./transaction";

export const loanPaymentTypeSchema = z.enum(["annuity", "equal_principal"]);
export type LoanPaymentTypeValue = z.infer<typeof loanPaymentTypeSchema>;

export const loanInputSchema = z.object({
  id: z.string().uuid().optional(),
  lender: z
    .string()
    .trim()
    .min(1, { message: t("validation.required") })
    .max(120, { message: t("validation.nameMax") }),
  principal: z
    .number()
    .finite()
    .positive({ message: t("validation.amount") })
    .max(1e15, { message: t("validation.amountTooLarge") }),
  annualRate: z
    .number()
    .finite()
    .min(0, { message: t("validation.rateRange") })
    .max(100, { message: t("validation.rateRange") }),
  termMonths: z
    .number()
    .int()
    .min(1, { message: t("validation.termRange") })
    .max(600, { message: t("validation.termRange") }),
  startDate: isoDateSchema,
  paymentType: loanPaymentTypeSchema,
  note: z
    .string()
    .trim()
    .max(500, { message: t("validation.noteMax") })
    .default(""),
});

export type LoanInput = z.infer<typeof loanInputSchema>;

export const loanFormSchema = z.object({
  lender: z
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
  annualRate: z
    .string()
    .trim()
    .refine((raw) => {
      if (raw === "") return true;
      const value = Number(raw);
      return Number.isFinite(value) && value >= 0 && value <= 100;
    }, { message: t("validation.rateRange") }),
  termMonths: z
    .string()
    .trim()
    .refine(
      (raw) => /^\d+$/.test(raw) && Number(raw) >= 1 && Number(raw) <= 600,
      { message: t("validation.termRange") },
    ),
  startDate: isoDateSchema,
  paymentType: loanPaymentTypeSchema,
  note: z
    .string()
    .trim()
    .max(500, { message: t("validation.noteMax") }),
});

export type LoanFormValues = z.infer<typeof loanFormSchema>;
