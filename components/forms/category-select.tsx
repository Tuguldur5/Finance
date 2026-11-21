"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/types/entities";

type CategorySelectProps = {
  categories: CategoryRow[];
  value: string;
  onChange: (categoryId: string) => void;
  placeholder: string;
  /** Adds a "Бүгд" entry that clears the value. */
  allowAll?: boolean;
  allLabel?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export function CategorySelect({
  categories,
  value,
  onChange,
  placeholder,
  allowAll = false,
  allLabel,
  disabled,
  className,
  id,
}: CategorySelectProps) {
  const [open, setOpen] = React.useState(false);
  const selected = categories.find((category) => category.id === value);
  const showAllLabel = allowAll && allLabel;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: selected.color }}
              />
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            <span className="truncate text-muted-foreground">
              {showAllLabel && !value ? allLabel : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={t("common.search")} />
          <CommandList>
            <CommandEmpty>{t("empty.title")}</CommandEmpty>
            <CommandGroup>
              {showAllLabel ? (
                <CommandItem
                  value={allLabel}
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === "" ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {allLabel}
                </CommandItem>
              ) : null}

              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  onSelect={() => {
                    onChange(category.id);
                    setOpen(false);
                  }}
                >
                  <span
                    className="mr-2 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="truncate">{category.name}</span>
                  <Check
                    className={cn(
                      "ml-auto size-4",
                      value === category.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
