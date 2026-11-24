"use client";

import { Search, SearchX } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CALCULATORS,
  CALCULATOR_CATEGORIES,
  getCategoryLabel,
  type CalculatorCategory,
} from "@/lib/calculators/registry";
import { t } from "@/lib/i18n";

import { CalculatorIcon } from "./calculator-icon";
import { DashboardBackLink } from "./dashboard-back-link";

type CategoryFilter = CalculatorCategory | "all";

type CalculatorsDirectoryProps = {
  /** `embedded` keeps every link inside the dashboard shell. */
  variant?: "public" | "embedded";
};

export function CalculatorsDirectory({
  variant = "public",
}: CalculatorsDirectoryProps) {
  const embedded = variant === "embedded";
  const basePath = embedded ? "/app/calculators" : "/calculators";
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<CategoryFilter>("all");
  const searchRef = React.useRef<HTMLInputElement>(null);

  // "/" focuses search, the same shortcut as the app's command palettes.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isEditing =
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";

      if (isEditing) return;

      event.preventDefault();
      searchRef.current?.focus();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const normalized = query.trim().toLowerCase();

  const visible = React.useMemo(() => {
    return CALCULATORS.filter((calculator) => {
      if (category !== "all" && calculator.category !== category) return false;
      if (!normalized) return true;

      return [
        calculator.title,
        calculator.description,
        getCategoryLabel(calculator.category),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [normalized, category]);

  const hasFilters = normalized !== "" || category !== "all";

  function clearFilters() {
    setQuery("");
    setCategory("all");
    searchRef.current?.focus();
  }

  return (
    <div>
      {embedded ? null : <DashboardBackLink />}

      <header className="mb-6">
        {embedded ? (
          <Breadcrumb className="mb-3">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/app">{t("nav.dashboard")}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t("calculators.directoryTitle")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ) : null}

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("calculators.directoryTitle")}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("calculators.subtitle")}
        </p>

        <div className="relative mt-5 max-w-md">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("calculators.searchPlaceholder")}
            aria-label={t("calculators.searchHint")}
            autoComplete="off"
            className="h-10 pr-10 pl-9"
          />
          <kbd
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            /
          </kbd>
        </div>
      </header>

      <Tabs
        value={category}
        onValueChange={(value) => setCategory(value as CategoryFilter)}
        className="mb-4 gap-0"
      >
        <TabsList
          variant="line"
          style={{ height: "auto" }}
          className="w-full flex-wrap justify-start gap-1 rounded-none border-b bg-transparent p-0"
        >
          <TabsTrigger
            value="all"
            className="h-9 flex-none px-3 text-xs sm:text-sm"
          >
            {t("common.all")}
          </TabsTrigger>
          {CALCULATOR_CATEGORIES.map((item) => (
            <TabsTrigger
              key={item}
              value={item}
              className="h-9 flex-none px-3 text-xs sm:text-sm"
            >
              {getCategoryLabel(item)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center">
          <span className="flex size-10 items-center justify-center rounded-full border bg-muted text-muted-foreground">
            <SearchX className="size-4" aria-hidden />
          </span>
          <p className="mt-3 text-sm font-medium">
            {t("calculators.emptyTitle")}
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            {t("calculators.emptyDescription")}
          </p>
          {hasFilters ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={clearFilters}
            >
              {t("calculators.clearFilters")}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((calculator) => (
            <Link
              key={calculator.slug}
              href={`${basePath}/${calculator.slug}`}
              className="calc-card flex items-start gap-3 rounded-lg p-3"
            >
              <span className="calc-card-icon flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                <CalculatorIcon name={calculator.icon} className="size-4" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-snug">
                  {calculator.title}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                  {calculator.description}
                </span>
                <Badge
                  variant="outline"
                  className="mt-2 px-1.5 text-[11px] font-normal text-muted-foreground"
                >
                  {getCategoryLabel(calculator.category)}
                </Badge>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
