"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createCategory,
  deleteCategory,
  setCategoryArchived,
  updateCategory,
} from "@/app/actions/categories";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { CategoryInput } from "@/lib/validation/category";
import type { ActionResult } from "@/types/actions";
import type { CategoryRow } from "@/types/entities";

export const categoryKeys = {
  all: ["categories"] as const,
};

async function fetchCategories(): Promise<CategoryRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, type, name, icon, color, parent_id, is_archived, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(t("errors.loadFailed"));

  return (data ?? []) as CategoryRow[];
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
  });
}

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function useInvalidateCategories() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["budgets"] });
  };
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();

  return useMutation({
    mutationFn: async (input: CategoryInput) =>
      unwrap(await createCategory(input)),
    onSuccess: () => {
      toast.success(t("toasts.created"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();

  return useMutation({
    mutationFn: async (input: CategoryInput) =>
      unwrap(await updateCategory(input)),
    onSuccess: () => {
      toast.success(t("toasts.updated"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useSetCategoryArchived() {
  const invalidate = useInvalidateCategories();

  return useMutation({
    mutationFn: async (input: { id: string; isArchived: boolean }) =>
      unwrap(await setCategoryArchived(input)),
    onSuccess: () => {
      toast.success(t("toasts.updated"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();

  return useMutation({
    mutationFn: async (id: string) => unwrap(await deleteCategory(id)),
    onSuccess: () => {
      toast.success(t("toasts.deleted"));
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
}
