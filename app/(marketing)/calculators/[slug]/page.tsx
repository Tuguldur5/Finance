import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CalculatorView } from "@/components/calculators/calculator-view";
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

  // `useSearchParams` needs a Suspense boundary during prerendering; results
  // are instant, so no loading skeleton is shown.
  return (
    <Suspense fallback={null}>
      <CalculatorView slug={slug} />
    </Suspense>
  );
}
