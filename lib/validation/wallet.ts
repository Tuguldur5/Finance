import { z } from "zod";

import { SUPPORTED_CURRENCIES } from "@/lib/config";
import { t } from "@/lib/i18n";
import { parseAmountInput } from "@/lib/finance/format";

export const walletTypeSchema = z.enum([
  "cash",
  "bank_account",
  "card",
  "e_wallet",
  "savings",
  "investment",
]);

export type WalletType = z.infer<typeof walletTypeSchema>;

export const walletInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, { message: t("validation.required") })
    .max(80, { message: t("validation.nameMax") }),
  type: walletTypeSchema,
  currency: z.enum(SUPPORTED_CURRENCIES),
  initialBalance: z
    .number()
    .finite()
    .max(1e15, { message: t("validation.amountTooLarge") }),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, { message: t("validation.invalidInput") }),
  icon: z.string().trim().min(1).max(40),
});

export type WalletInput = z.infer<typeof walletInputSchema>;

/** Form variant: balance is a formatted string while typing. */
export const walletFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: t("validation.required") })
    .max(80, { message: t("validation.nameMax") }),
  type: walletTypeSchema,
  currency: z.enum(SUPPORTED_CURRENCIES),
  initialBalance: z
    .string()
    .trim()
    .min(1, { message: t("validation.required") })
    .refine(
      (raw) => {
        const value = parseAmountInput(raw);
        return value !== null && Number.isFinite(value);
      },
      { message: t("validation.amountInvalid") },
    )
    .refine((raw) => (parseAmountInput(raw) ?? 0) <= 1e15, {
      message: t("validation.amountTooLarge"),
    }),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, { message: t("validation.invalidInput") }),
  icon: z.string().trim().min(1),
});

export type WalletFormValues = z.infer<typeof walletFormSchema>;
