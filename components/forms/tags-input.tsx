"use client";

import { X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";

type TagsInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  max?: number;
};

export function TagsInput({
  value,
  onChange,
  id,
  placeholder,
  disabled,
  max = 10,
}: TagsInputProps) {
  const [draft, setDraft] = React.useState("");

  function addTag() {
    const tag = draft.trim().replace(/,$/, "");

    if (!tag) {
      setDraft("");
      return;
    }

    if (tag.length > 30) {
      toast.error(t("validation.tagLength"));
      return;
    }

    if (value.includes(tag)) {
      setDraft("");
      return;
    }

    if (value.length >= max) {
      toast.error(t("validation.tagsMax"));
      return;
    }

    onChange([...value, tag]);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <Input
        id={id}
        value={draft}
        disabled={disabled}
        placeholder={placeholder ?? t("transactions.tagsPlaceholder")}
        autoComplete="off"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addTag();
          }

          if (event.key === "Backspace" && draft === "" && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={addTag}
      />

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(value.filter((item) => item !== tag))}
                className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                aria-label={`${tag} — ${t("common.delete")}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
