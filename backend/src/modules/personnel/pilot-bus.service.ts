import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { ensure } from "../../lib/domain-error.js";
import { writeAudit } from "../audit/audit.service.js";
const current = () => ({ fecha_fin: null, fecha_inicio: { lte: new Date() } });

export async function ensureBusPilot(tx: Prisma.TransactionClient, busId: number, message: string) {
  const assignment = await tx.asignacion_piloto_bus.findFirst({ where: { bus_id: busId, ...current(), piloto: { activo: true } } });
  ensure(assignment, 409, message);
  return assignment;
}

export async function assignPilotBus(actorId: number, pilotId: number, busId: number, startDate?: string, replacePilot = false) {
  return prisma.$transaction(async tx => {
    const [pilot, bus] = await Promise.all([
      tx.piloto.findUnique({ where: { id_piloto: pilotId } }),
      tx.bus.findUnique({ where: { id_bus: busId } }),
    ]);
    ensure(pilot?.activo, 400, "Selecciona un piloto activo.");
    ensure(bus?.activo, 400, "Selecciona un bus activo.");
    const existing = await tx.asignacion_piloto_bus.findMany({
      where: { fecha_fin: null, OR: [{ piloto_id: pilotId }, { bus_id: busId }] },
    });
    const previousPilot = existing.find(item => item.piloto_id === pilotId);
    const previousBus = existing.find(item => item.bus_id === busId);
    // Stable row locks coordinate this change with line assignments and trip starts.
    for (const id of [...new Set([busId, ...existing.map(item => item.bus_id)])].sort((a, b) => a - b)) {
      await tx.$queryRaw`SELECT id FROM buses WHERE id = ${id} FOR UPDATE`;
    }
    for (const id of [...new Set([pilotId, ...existing.map(item => item.piloto_id)])].sort((a, b) => a - b)) {
      await tx.$queryRaw`SELECT id FROM pilotos WHERE id = ${id} FOR UPDATE`;
    }
    ensure(replacePilot || !previousBus || previousBus.piloto_id === pilotId, 409, "El bus ya tiene otro piloto vigente. Utiliza Reasignar piloto desde Buses.");
    ensure(!replacePilot || !previousPilot || previousPilot.bus_id === busId, 409, "El piloto ya tiene otro bus vigente.");
    const openTrips = await tx.recorrido.count({ where: { bus_id: { in: [...new Set([busId, ...existing.map(item => item.bus_id)])] }, estado: "EN_CURSO" } });
    ensure(openTrips === 0, 409, "No se puede cambiar el piloto de un bus con un recorrido EN_CURSO.");
    if (previousPilot?.bus_id === busId) return previousPilot;
    if (previousPilot) {
      const line = await tx.asignacion_bus_linea.findFirst({ where: { bus_id: previousPilot.bus_id, ...current() } });
      ensure(!line, 409, "No puedes dejar sin piloto un bus asignado a una línea. Reasigna su piloto desde Buses.");
    }
    const now = new Date();
    const requested = startDate ? new Date(startDate) : now;
    ensure(Number.isFinite(requested.getTime()) && requested <= now, 400, "La fecha de inicio no puede estar en el futuro.");
    const started = new Date(Math.floor(requested.getTime() / 1000) * 1000);
    ensure(existing.every(item => started >= item.fecha_inicio), 400, "La fecha no puede preceder la asignación vigente.");
    const history = await tx.asignacion_piloto_bus.findMany({
      where: { fecha_fin: { not: null }, OR: [{ piloto_id: pilotId }, { bus_id: busId }] },
      orderBy: { fecha_fin: "desc" }, take: 1,
    });
    ensure(!history[0]?.fecha_fin || started >= history[0].fecha_fin, 400, "La fecha de inicio se superpone al historial de asignaciones.");
    if (existing.length) await tx.asignacion_piloto_bus.updateMany({
      where: { id_asignacion_piloto_bus: { in: existing.map(item => item.id_asignacion_piloto_bus) } }, data: { fecha_fin: started },
    });
    const item = await tx.asignacion_piloto_bus.create({ data: { piloto_id: pilotId, bus_id: busId, fecha_inicio: started } });
    await writeAudit(tx, { userId: actorId, action: existing.length ? "REASIGNAR_PILOTO_BUS" : "ASIGNAR_PILOTO_BUS",
      entity: "asignacion_piloto_bus", entityId: item.id_asignacion_piloto_bus, description: `${pilot.nombre} · ${bus.codigo}` });
    return item;
  }, { isolationLevel: "Serializable" });
}

export async function endPilotBus(actorId: number, id: number) {
  return prisma.$transaction(async tx => {
    const assignment = await tx.asignacion_piloto_bus.findUnique({ where: { id_asignacion_piloto_bus: id } });
    ensure(assignment && assignment.fecha_fin === null, 404, "No se encontró una asignación de piloto vigente.");
    await tx.$queryRaw`SELECT id FROM buses WHERE id = ${assignment.bus_id} FOR UPDATE`;
    const [line, openTrips] = await Promise.all([
      tx.asignacion_bus_linea.findFirst({ where: { bus_id: assignment.bus_id, ...current() } }),
      tx.recorrido.count({ where: { bus_id: assignment.bus_id, estado: "EN_CURSO" } }),
    ]);
    ensure(!openTrips, 409, "No se puede cambiar el piloto con un recorrido EN_CURSO.");
    ensure(!line, 409, "El bus está asignado a una línea. Utiliza Reasignar piloto sin dejarlo sin responsable.");
    const item = await tx.asignacion_piloto_bus.update({ where: { id_asignacion_piloto_bus: id }, data: { fecha_fin: new Date() } });
    await writeAudit(tx, { userId: actorId, action: "FINALIZAR_PILOTO_BUS", entity: "asignacion_piloto_bus", entityId: id });
    return item;
  }, { isolationLevel: "Serializable" });
}
