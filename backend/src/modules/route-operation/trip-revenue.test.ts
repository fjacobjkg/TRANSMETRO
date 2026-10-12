import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ trips: vi.fn(), count: vi.fn(), audits: vi.fn(), payments: vi.fn() }));
vi.mock("../../lib/prisma.js", () => ({ prisma: { recorrido: { findMany: m.trips, count: m.count },
  bitacora: { findMany: m.audits }, estacion_medio_acceso: { findMany: m.payments } } }));
import { listTrips } from "./route-operation.service.js";
const actor = { id: 1, name: "Admin", username: "admin", role: "ADMIN" as const, stationIds: [] };

describe("Consulta de recorridos con recaudación", () => {
  beforeEach(() => {
    vi.resetAllMocks(); m.audits.mockResolvedValue([]); m.count.mockResolvedValue(1);
    m.trips.mockResolvedValue([{ id_recorrido: 1n, estado: "FINALIZADO", bus: { capacidad_maxima: 250 },
      visitas: [{ id_visita: 1n, estacion_id: 1, ocupacion: 220, demanda: 375, personas_abordan: 10 },
        { id_visita: 2n, estacion_id: 2, ocupacion: 220, demanda: 80, personas_abordan: 5 }] }]);
  });
  it("integra tarifas de la BD sin alterar demanda, ocupación ni abordajes", async () => {
    m.payments.mockResolvedValue([{ estacion_id: 1, medio_acceso: { nombre: "Tarjeta", tarifa: "2.50" } }]);
    const result = await listTrips(actor, { state: "FINALIZADO", page: 1, pageSize: 100 });
    expect(result.items[0]?.visitas[0]).toMatchObject({ demanda: 375, ocupacion: 220, personas_abordan: 10,
      revenue: { medium: "Tarjeta", tariff: "2.50", estimatedRevenue: "937.50" } });
    expect(result.items[0]?.visitas[1]?.revenue).toMatchObject({ medium: null, estimatedRevenue: null, configurationIssue: "Sin medio de pago principal" });
    expect(m.payments).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ activo: true, es_principal: true, medio_acceso: { activo: true } }) }));
  });
  it("conserva la paginación y evita consultas de configuración cuando no hay visitas", async () => {
    m.trips.mockResolvedValue([]); m.count.mockResolvedValue(0);
    const result = await listTrips(actor, { state: "FINALIZADO", page: 2, pageSize: 100 });
    expect(result.items).toEqual([]); expect(result.total).toBe(0); expect(result.page).toBe(2);
    expect(m.payments).not.toHaveBeenCalled();
  });
});
