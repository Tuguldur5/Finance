"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  CALCULATOR_CATEGORIES,
  CALCULATORS,
  getCalculatorsByCategory,
  type CalculatorCategory,
} from "@/lib/calculators/registry";
import { t } from "@/lib/i18n";

import { CalculatorIcon } from "./calculator-icon";

export function CalculatorsDirectory() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const groups = getCalculatorsByCategory();

  const normalized = query.trim().toLowerCase();

  const matches = (slug: string, category: CalculatorCategory) => {
    if (!normalized) return true;
    const haystack = [
      t(`calculators.items.${slug}.title`),
      t(`calculators.items.${slug}.description`),
      t(`calculators.categories.${category}`),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  };

  const visibleCount = CALCULATORS.filter((calculator) =>
    matches(calculator.slug, calculator.category),
  ).length;

  return (
    <Command
      shouldFilter={false}
      className="rounded-lg border bg-card shadow-none"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t("calculators.searchPlaceholder")}
      />
      <CommandList className="max-h-none">
        <CommandEmpty>{t("calculators.noResults")}</CommandEmpty>

        {visibleCount === 0 ? null : (
          <>
            {CALCULATOR_CATEGORIES.map((category) => {
              const items = groups[category].filter((calculator) =>
                matches(calculator.slug, category),
              );
              if (items.length === 0) return null;

              return (
                <CommandGroup
                  key={category}
                  heading={t(`calculators.categories.${category}`)}
                >
                  <div className="grid gap-1.5 pb-1 sm:grid-cols-2">
                    {items.map((calculator) => (
                      <CommandItem
                        key={calculator.slug}
                        value={calculator.slug}
                        onSelect={() =>
                          router.push(`/calculators/${calculator.slug}`)
                        }
                        className="group items-start gap-3 rounded-md border px-3 py-2.5 data-[selected=true]:border-primary/40"
                      >
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
                          <CalculatorIcon
                            name={calculator.icon}
                            className="size-3.5"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">
                            {t(`calculators.items.${calculator.slug}.title`)}
                          </span>
                          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                            {t(
                              `calculators.items.${calculator.slug}.description`,
                            )}
                          </span>
                        </span>
                        <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
                      </CommandItem>
                    ))}
                  </div>
                </CommandGroup>
              );
            })}
          </>
        )}
      </CommandList>
    </Command>
  );
}
