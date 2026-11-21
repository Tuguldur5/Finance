"use client";

import {
  ArrowLeftRight,
  Banknote,
  Calculator,
  CircleDollarSign,
  Home,
  Landmark,
  LineChart,
  Percent,
  PieChart,
  PiggyBank,
  ReceiptText,
  Scale,
  Tag,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Landmark,
  Home,
  Percent,
  TrendingUp,
  PiggyBank,
  LineChart,
  Banknote,
  ReceiptText,
  ArrowLeftRight,
  CircleDollarSign,
  PieChart,
  Scale,
  Tag,
  Wallet,
};

export function CalculatorIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Calculator;
  return <Icon className={className} aria-hidden />;
}
