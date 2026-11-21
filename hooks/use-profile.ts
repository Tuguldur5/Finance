"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateProfile } from "@/app/actions/profile";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { ProfileInput } from "@/lib/validation/profile";
import type { ActionResult } from "@/types/actions";
import type { ProfileRow } from "@/types/entities";

export const profileKeys = {
  all: ["profile"] as const,
};

async function fetchProfile(): Promise<ProfileRow | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, currency, theme")
    .maybeSingle();

  if (error) throw new Error(t("errors.loadFailed"));

  return (data as ProfileRow | null) ?? null;
}

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: fetchProfile,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProfileInput): Promise<ProfileRow> => {
      const result: ActionResult<ProfileRow> = await updateProfile(input);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.all, profile);
      toast.success(t("toasts.saved"));
    },
    onError: (error) => toast.error(error.message),
  });
}
