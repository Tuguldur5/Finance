import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CalculatorView } from "@/components/calculators/calculator-view";
import { CALCULATORS, isCalculatorSlug } from "@/lib/calculators/registry";
import { t } from "@/lib/i18n";

type AppCalculatorPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return CALCULATORS.map((calculator) => ({ slug: calculator.slug }));
}

export async function generateMetadata({
  params,
}: AppCalculatorPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!isCalculatorSlug(slug)) return {};

  return {
    title: t(`calculators.items.${slug}.title`),
    description: t(`calculators.items.${slug}.description`),
  };
}

export default async function AppCalculatorPage({
  params,
}: AppCalculatorPageProps) {
  const { slug } = await params;

  if (!isCalculatorSlug(slug)) notFound();

  return (
    <Suspense fallback={null}>
      <CalculatorView slug={slug} variant="embedded" />
    </Suspense>
  );
}
