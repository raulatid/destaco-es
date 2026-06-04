import {
  Briefcase,
  Camera,
  Car,
  Code,
  Dumbbell,
  GraduationCap,
  Hammer,
  Home,
  Megaphone,
  Scale,
  Scissors,
  Stethoscope,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  megaphone: Megaphone,
  scale: Scale,
  stethoscope: Stethoscope,
  utensils: UtensilsCrossed,
  hammer: Hammer,
  code: Code,
  home: Home,
  scissors: Scissors,
  "graduation-cap": GraduationCap,
  car: Car,
  dumbbell: Dumbbell,
  camera: Camera,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Briefcase;
  return <Icon className={className} />;
}
