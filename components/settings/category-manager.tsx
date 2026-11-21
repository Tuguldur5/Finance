"use client";

import {
  Archive,
  ArchiveRestore,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import * as React from "react";

import { EntityIcon } from "@/components/entity-icon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useSetCategoryArchived,
  useUpdateCategory,
} from "@/hooks/use-categories";
import { t } from "@/lib/i18n";
import { CATEGORY_ICONS, COLOR_PRESETS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { CategoryInput } from "@/lib/validation/category";
import type { CategoryRow } from "@/types/entities";

type CategoryType = CategoryInput["type"];

function CategoryForm({
  category,
  type,
  onDone,
}: {
  category?: CategoryRow | null;
  type: CategoryType;
  onDone: () => void;
}) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const pending = createCategory.isPending || updateCategory.isPending;

  const [name, setName] = React.useState(category?.name ?? "");
  const [icon, setIcon] = React.useState(category?.icon ?? "circle");
  const [color, setColor] = React.useState(category?.color ?? COLOR_PRESETS[0]);
  const [error, setError] = React.useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError(t("validation.required"));
      return;
    }

    setError("");

    try {
      if (category) {
        await updateCategory.mutateAsync({
          id: category.id,
          type,
          name: trimmed,
          icon,
          color,
        });
      } else {
        await createCategory.mutateAsync({ type, name: trimmed, icon, color });
      }
      onDone();
    } catch {
      // Toast already shown.
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-1.5">
        <Label htmlFor="category-name" className="text-xs font-medium">
          {t("settings.categoryName")}
        </Label>
        <Input
          id="category-name"
          value={name}
          maxLength={80}
          autoComplete="off"
          aria-invalid={Boolean(error)}
          onChange={(event) => setName(event.target.value)}
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>

      <div className="grid gap-1.5">
        <span className="text-xs font-medium">
          {t("settings.categoryIcon")}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_ICONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={option}
              aria-pressed={icon === option}
              onClick={() => setIcon(option)}
              className={cn(
                "flex size-8 items-center justify-center rounded-md border text-muted-foreground transition-colors",
                icon === option
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "hover:bg-muted",
              )}
            >
              <EntityIcon name={option} className="size-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-1.5">
        <span className="text-xs font-medium">
          {t("settings.categoryColor")}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={preset}
              aria-pressed={color === preset}
              onClick={() => setColor(preset)}
              className={cn(
                "size-7 cursor-pointer rounded-md border transition-shadow",
                color === preset
                  ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
                  : "hover:ring-2 hover:ring-ring/50",
              )}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={pending}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {category ? t("common.save") : t("common.create")}
        </Button>
      </div>
    </form>
  );
}

export function CategoryManager() {
  const { data, isLoading, isError, error, refetch } = useCategories();
  const setArchived = useSetCategoryArchived();
  const deleteCategory = useDeleteCategory();

  const [tab, setTab] = React.useState<CategoryType>("expense");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = React.useState<CategoryRow | null>(null);

  const categories = React.useMemo(
    () =>
      (data ?? [])
        .filter((category) => category.type === tab)
        .sort(
          (a, b) =>
            Number(a.is_archived) - Number(b.is_archived) ||
            a.sort_order - b.sort_order ||
            a.name.localeCompare(b.name),
        ),
    [data, tab],
  );

  return (
    <>
      <Card className="gap-0 py-4">
        <CardHeader className="px-4 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-medium">
                {t("settings.categoriesTitle")}
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                {t("settings.categoriesDescription")}
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              {t("settings.addCategory")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-4">
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as CategoryType)}
            className="mb-2"
          >
            <TabsList>
              <TabsTrigger value="expense">
                {t("transactions.typeExpense")}
              </TabsTrigger>
              <TabsTrigger value="income">
                {t("transactions.typeIncome")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full rounded-md" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-5 text-center">
              <p className="text-xs text-destructive">
                {error instanceof Error ? error.message : t("errors.loadFailed")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => void refetch()}
              >
                {t("common.retry")}
              </Button>
            </div>
          ) : categories.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              {t("settings.noCategories")}
            </p>
          ) : (
            <ul className="max-h-80 divide-y overflow-y-auto">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center gap-2 py-1.5"
                >
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-md border"
                    style={{
                      backgroundColor: `${category.color}1a`,
                      color: category.color,
                      borderColor: `${category.color}33`,
                    }}
                  >
                    <EntityIcon name={category.icon} className="size-3.5" />
                  </span>

                  <span className="min-w-0 flex-1 truncate text-sm">
                    {category.name}
                  </span>

                  {category.is_archived ? (
                    <Badge
                      variant="outline"
                      className="px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
                    >
                      {t("settings.archiveCategory")}
                    </Badge>
                  ) : null}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("common.actions")}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditing(category);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          setArchived.mutate({
                            id: category.id,
                            isArchived: !category.is_archived,
                          })
                        }
                      >
                        {category.is_archived ? (
                          <ArchiveRestore className="size-4" />
                        ) : (
                          <Archive className="size-4" />
                        )}
                        {category.is_archived
                          ? t("settings.restoreCategory")
                          : t("settings.archiveCategory")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setDeleting(category)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("settings.editCategory") : t("settings.newCategory")}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? t("settings.categoriesDescription")
                : t("settings.categoriesDescription")}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            key={`${editing?.id ?? "new"}-${tab}`}
            category={editing}
            type={tab}
            onDone={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.categoryDeleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.categoryDeleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) deleteCategory.mutate(deleting.id);
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
