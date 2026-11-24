import { t } from "@/lib/i18n";

/**
 * Public calculator catalog. The single source of truth for the directory,
 * the detail pages and the app shell — never duplicate this list in a view.
 */

export const CALCULATOR_CATEGORIES = [
  "credit",
  "growth",
  "tax",
  "business",
  "everyday",
] as const;

export type CalculatorCategory = (typeof CALCULATOR_CATEGORIES)[number];

export type CalculatorDefinition = {
  slug: string;
  title: string;
  description: string;
  category: CalculatorCategory;
  /** Lucide icon name, resolved in `CalculatorIcon`. */
  icon: string;
};

function define(
  slug: string,
  category: CalculatorCategory,
  icon: string,
): CalculatorDefinition {
  return {
    slug,
    category,
    icon,
    title: t(`calculators.items.${slug}.title`),
    description: t(`calculators.items.${slug}.description`),
  };
}

export const CALCULATORS: readonly CalculatorDefinition[] = [
  define("loan", "credit", "Landmark"),
  define("mortgage", "credit", "Home"),
  define("interest", "growth", "Percent"),
  define("compound", "growth", "TrendingUp"),
  define("savings", "growth", "PiggyBank"),
  define("investment", "growth", "LineChart"),
  define("salary", "tax", "Banknote"),
  define("vat", "tax", "ReceiptText"),
  define("profit", "business", "CircleDollarSign"),
  define("margin", "business", "PieChart"),
  define("breakeven", "business", "Scale"),
  define("discount", "business", "Tag"),
  define("currency", "everyday", "ArrowLeftRight"),
  define("budget", "everyday", "Wallet"),
] as const;

/** Backwards-compatible name used by the calculator page metadata. */
export type CalculatorMeta = CalculatorDefinition;

export const CALCULATOR_SLUGS = CALCULATORS.map(
  (calculator) => calculator.slug,
) as readonly string[];

export function isCalculatorSlug(value: string): boolean {
  return CALCULATOR_SLUGS.includes(value);
}

export function getCalculatorMeta(
  slug: string,
): CalculatorDefinition | undefined {
  return CALCULATORS.find((calculator) => calculator.slug === slug);
}

export function getCategoryLabel(category: CalculatorCategory): string {
  return t(`calculators.categories.${category}`);
}

export function getCalculatorsByCategory(): Record<
  CalculatorCategory,
  CalculatorDefinition[]
> {
  const groups = Object.fromEntries(
    CALCULATOR_CATEGORIES.map((category) => [
      category,
      [] as CalculatorDefinition[],
    ]),
  ) as Record<CalculatorCategory, CalculatorDefinition[]>;

  for (const calculator of CALCULATORS) {
    groups[calculator.category].push(calculator);
  }

  return groups;
}
