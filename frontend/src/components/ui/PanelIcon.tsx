import { Activity, BarChart3, Building2, Bus, History, Home, Map, UserCog, Users, type LucideIcon } from "lucide-react";
const icons: Record<string, LucideIcon> = { home: Home, users: Users, transport: Map, personnel: UserCog, fleet: Bus, operations: Activity, reports: BarChart3, audit: History };
export function PanelIcon({ id, size = 18 }: { id: string; size?: number }) {
  const Icon = icons[id] ?? Building2;
  return <Icon aria-hidden="true" size={size} strokeWidth={1.8} />;
}
