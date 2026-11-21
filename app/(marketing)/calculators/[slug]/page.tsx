import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CalculatorView } from "@/components/calculators/calculator-view";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CALCULATORS,
  isCalculatorSlug,
} from "@/lib/calculators/registry";
import { t } from "@/lib/i18n";

type CalculatorPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return CALCULATORS.map((calculator) => ({ slug: calculator.slug }));
}

export async function generateMetadata({
  params,
}: CalculatorPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!isCalculatorSlug(slug)) return {};

  return {
    title: t(`calculators.items.${slug}.title`),
    description: t(`calculators.items.${slug}.description`),
  };
}

export default async function CalculatorPage({ params }: CalculatorPageProps) {
  const { slug } = await params;

  if (!isCalculatorSlug(slug)) notFound();

  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-80" />
          <div className="grid gap-3 lg:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      }
    >
      <CalculatorView slug={slug} />
    </Suspense>
  );
}
