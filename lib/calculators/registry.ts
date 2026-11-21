/** Public calculator catalog. No database, no auth. */

export const CALCULATOR_CATEGORIES = [
  "credit",
  "growth",
  "business",
  "everyday",
  "tax",
] as const;

export type CalculatorCategory = (typeof CALCULATOR_CATEGORIES)[number];

export type CalculatorMeta = {
  slug: string;
  category: CalculatorCategory;
  /** Lucide icon name, resolved in the UI. */
  icon: string;
};

export const CALCULATORS: readonly CalculatorMeta[] = [
  { slug: "loan", category: "credit", icon: "Landmark" },
  { slug: "mortgage", category: "credit", icon: "Home" },
  { slug: "interest", category: "growth", icon: "Percent" },
  { slug: "compound", category: "growth", icon: "TrendingUp" },
  { slug: "savings", category: "growth", icon: "PiggyBank" },
  { slug: "investment", category: "growth", icon: "LineChart" },
  { slug: "salary", category: "tax", icon: "Banknote" },
  { slug: "vat", category: "tax", icon: "ReceiptText" },
  { slug: "currency", category: "everyday", icon: "ArrowLeftRight" },
  { slug: "profit", category: "business", icon: "CircleDollarSign" },
  { slug: "margin", category: "business", icon: "PieChart" },
  { slug: "breakeven", category: "business", icon: "Scale" },
  { slug: "discount", category: "business", icon: "Tag" },
  { slug: "budget", category: "everyday", icon: "Wallet" },
] as const;

export const CALCULATOR_SLUGS = CALCULATORS.map(
  (calculator) => calculator.slug,
) as readonly string[];

export function isCalculatorSlug(value: string): boolean {
  return CALCULATOR_SLUGS.includes(value);
}

export function getCalculatorMeta(slug: string): CalculatorMeta | undefined {
  return CALCULATORS.find((calculator) => calculator.slug === slug);
}

export function getCalculatorsByCategory(): Record<
  CalculatorCategory,
  CalculatorMeta[]
> {
  const groups = Object.fromEntries(
    CALCULATOR_CATEGORIES.map((category) => [category, [] as CalculatorMeta[]]),
  ) as Record<CalculatorCategory, CalculatorMeta[]>;

  for (const calculator of CALCULATORS) {
    groups[calculator.category].push(calculator);
  }

  return groups;
}
