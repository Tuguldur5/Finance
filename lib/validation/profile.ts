import { z } from "zod";

import { SUPPORTED_CURRENCIES } from "@/lib/config";
import { t } from "@/lib/i18n";

export const profileInputSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(80, { message: t("validation.nameMax") }),
  currency: z.enum(SUPPORTED_CURRENCIES),
  theme: z.enum(["dark", "light", "system"]),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
