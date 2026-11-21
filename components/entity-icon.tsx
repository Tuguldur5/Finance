import {
  Armchair,
  Baby,
  Banknote,
  Briefcase,
  Building2,
  Bus,
  Circle,
  CreditCard,
  Ellipsis,
  Fuel,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  KeyRound,
  Landmark,
  Percent,
  PiggyBank,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  armchair: Armchair,
  baby: Baby,
  banknote: Banknote,
  briefcase: Briefcase,
  "building-2": Building2,
  bus: Bus,
  circle: Circle,
  "credit-card": CreditCard,
  ellipsis: Ellipsis,
  fuel: Fuel,
  gift: Gift,
  "graduation-cap": GraduationCap,
  "heart-pulse": HeartPulse,
  house: House,
  "key-round": KeyRound,
  landmark: Landmark,
  percent: Percent,
  "piggy-bank": PiggyBank,
  smartphone: Smartphone,
  sparkles: Sparkles,
  target: Target,
  "trending-up": TrendingUp,
  utensils: Utensils,
  wallet: Wallet,
  wifi: Wifi,
  zap: Zap,
};

export function EntityIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = iconMap[name] ?? Circle;
  return <Icon className={className} aria-hidden="true" />;
}

/** Icon choices offered in the wallet form. */
export const WALLET_ICON_OPTIONS = [
  "wallet",
  "banknote",
  "credit-card",
  "smartphone",
  "piggy-bank",
  "landmark",
  "trending-up",
] as const;
