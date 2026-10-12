import { prisma } from "../../lib/prisma.js";
import { visitRevenue } from "./revenue.js";

export async function attachVisitRevenue<T extends { estacion_id: number; demanda: number }>(visits: T[]) {
  if (!visits.length) return [];
  const payments = await prisma.estacion_medio_acceso.findMany({
    where: { estacion_id: { in: [...new Set(visits.map(visit => visit.estacion_id))] }, activo: true,
      es_principal: true, medio_acceso: { activo: true } }, include: { medio_acceso: true },
  });
  return visits.map(visit => ({ ...visit, revenue: visitRevenue(visit.demanda, payments.filter(payment => payment.estacion_id === visit.estacion_id)) }));
}
