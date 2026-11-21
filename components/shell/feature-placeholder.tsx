import type { LucideIcon } from "lucide-react";
import * as React from "react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

type FeaturePlaceholderProps = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: LucideIcon;
  action?: React.ReactNode;
};

/** Page shell used by features that arrive in later phases. */
export function FeaturePlaceholder({
  title,
  description,
  emptyTitle,
  emptyDescription,
  icon,
  action,
}: FeaturePlaceholderProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title={emptyTitle}
        description={emptyDescription}
        action={action}
      />
    </>
  );
}
