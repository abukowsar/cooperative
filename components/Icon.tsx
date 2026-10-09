import {
  Baby, Beef, BookOpen, Calculator, Flame, GraduationCap, HandCoins, HeartPulse, Home, Info,
  MessageCircle, Milk, PiggyBank, Recycle, Sprout, Store, Syringe, Users, Wheat, type LucideProps,
} from "lucide-react";
import type { IconName } from "@/lib/content";

const MAP: Record<IconName, React.ComponentType<LucideProps>> = {
  piggy: PiggyBank, grad: GraduationCap, coins: HandCoins, heart: HeartPulse, syringe: Syringe,
  milk: Milk, store: Store, flame: Flame, beef: Beef, sprout: Sprout, message: MessageCircle,
  users: Users, calc: Calculator, book: BookOpen, home: Home, wheat: Wheat, recycle: Recycle, baby: Baby, info: Info,
};

export default function Icon({ name, size = 22, ...rest }: { name: IconName } & LucideProps) {
  const C = MAP[name];
  return <C size={size} strokeWidth={1.8} aria-hidden {...rest} />;
}
