import {
  Activity,
  BusFront,
  ChartNoAxesCombined,
  ContactRound,
  CreditCard,
  History,
  House,
  Route,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "../types/auth";

const icons: Record<string, LucideIcon> = {
  home: House,
  transport: Route,
  fleet: BusFront,
  users: UsersRound,
  personnel: ContactRound,
  "security-access": ShieldCheck,
  operations: Activity,
  reports: ChartNoAxesCombined,
  audit: History,
  "access-counts": CreditCard,
};

export function SidebarIcon({ id, role }: { id: string; role: UserRole }) {
  const Icon = id === "operations" && role === "OPERADOR_ESTACION" ? Route : icons[id] ?? House;
  return <Icon aria-hidden="true" size={18} strokeWidth={1.8} />;
}
