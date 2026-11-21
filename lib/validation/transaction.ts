import { z } from "zod";

import { parseAmountInput } from "@/lib/finance/format";
import { t } from "@/lib/i18n";

export const transactionTypeSchema = z.enum(["income", "expense", "transfer"]);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: t("validation.invalidDate") });

const tagsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1)
      .max(30, { message: t("validation.tagLength") }),
  )
  .max(10, { message: t("validation.tagsMax") });

const noteSchema = z
  .string()
  .trim()
  .max(500, { message: t("validation.noteMax") });

function validateTransferShape(
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

/** Payload accepted by the server actions. */
export const transactionInputSchema = z
  .object({
    type: transactionTypeSchema,
    amount: z
      .number()
      .finite()
      .positive({ message: t("validation.amount") })
      .max(1e15, { message: t("validation.amountTooLarge") }),
    walletId: z.string().uuid({ message: t("validation.selectWallet") }),
    toWalletId: z.string().uuid().nullish(),
    categoryId: z.string().uuid().nullish(),
    occurredAt: isoDateSchema,
    note: noteSchema.default(""),
    tags: tagsSchema.default([]),
  })
  .superRefine(validateTransferShape);

export type TransactionInput = z.infer<typeof transactionInputSchema>;

/** react-hook-form variant: amount is a formatted string. */
export const transactionFormSchema = z
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
      )
      .refine((raw) => (parseAmountInput(raw) ?? 0) <= 1e15, {
        message: t("validation.amountTooLarge"),
      }),
    walletId: z.string().min(1, { message: t("validation.selectWallet") }),
    toWalletId: z.string(),
    categoryId: z.string(),
    occurredAt: isoDateSchema,
    note: noteSchema,
    tags: tagsSchema,
  })
  .superRefine(validateTransferShape);

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
