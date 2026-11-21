import { z } from "zod";

import { t } from "@/lib/i18n";

export const categoryInputSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["income", "expense"]),
  name: z
    .string()
    .trim()
    .min(1, { message: t("validation.required") })
    .max(80, { message: t("validation.nameMax") }),
  icon: z
    .string()
    .regex(/^[a-z0-9-]{1,40}$/, { message: t("validation.invalidInput") }),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, { message: t("validation.invalidInput") }),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: t("validation.required") })
    .max(80, { message: t("validation.nameMax") }),
  icon: z.string().min(1, { message: t("validation.required") }),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, { message: t("validation.invalidInput") }),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
