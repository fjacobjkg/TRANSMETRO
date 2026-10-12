import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ transaction: vi.fn(), station: vi.fn(), media: vi.fn(), query: vi.fn(),
  find: vi.fn(), list: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), audit: vi.fn(),
  rows: [] as Array<{ id_estacion_medio_acceso: number; estacion_id: number; medio_acceso_id: number; activo: boolean; es_principal: boolean }> }));
vi.mock("../../lib/prisma.js", () => ({ prisma: { $transaction: mock.transaction, estacion_medio_acceso: { findMany: mock.list } } }));
import { setStationMedia } from "./access-media.service.js";
import { mediaSchema, tariffSchema } from "./access-media.schema.js";
import { visitRevenue } from "./revenue.js";
import { attachVisitRevenue } from "./revenue.service.js";

describe("Tarifas y medio principal", () => {
  beforeEach(() => {
    vi.resetAllMocks(); mock.rows.length = 0;
    mock.station.mockResolvedValue({ id_estacion: 1, activo: true, codigo: "E1" });
    mock.media.mockImplementation(async ({ where }) => ({ id_medio_acceso: where.id_medio_acceso, activo: true, nombre: "Medio", tarifa: "2.50" }));
    mock.transaction.mockImplementation(async fn => fn({ $queryRaw: mock.query,
      estacion: { findUnique: mock.station }, medio_acceso: { findUnique: mock.media }, bitacora: { create: mock.audit },
      estacion_medio_acceso: { findUnique: mock.find, findMany: mock.list, create: mock.create, update: mock.update, updateMany: mock.updateMany } }));
    mock.find.mockImplementation(async ({ where }) => mock.rows.find(row => row.estacion_id === where.estacion_id_medio_acceso_id.estacion_id && row.medio_acceso_id === where.estacion_id_medio_acceso_id.medio_acceso_id));
    mock.list.mockImplementation(async () => mock.rows.filter(row => row.activo));
    mock.create.mockImplementation(async ({ data }) => { const row = { id_estacion_medio_acceso: mock.rows.length + 1, ...data }; mock.rows.push(row); return row; });
    mock.update.mockImplementation(async ({ where, data }) => Object.assign(mock.rows.find(row => row.id_estacion_medio_acceso === where.id_estacion_medio_acceso)!, data));
    mock.updateMany.mockImplementation(async ({ where, data }) => {
      mock.rows.filter(row => row.estacion_id === where.estacion_id && row.es_principal).forEach(row => Object.assign(row, data));
      return { count: 1 };
    });
  });
  it.each(["0.01", "1.00", "2.50", 3.75, "99999999.99"])("acepta tarifa positiva con dos decimales: %s", value => {
    expect(tariffSchema.safeParse(value).success).toBe(true);
  });
  it.each([0, -1, "0.00", "1.005", "texto", "100000000.00", Infinity, null])("rechaza tarifa inválida: %s", value => {
    expect(tariffSchema.safeParse(value).success).toBe(false);
  });
  it("exige tarifa al crear un medio", () => {
    expect(mediaSchema.safeParse({ name: "Tarjeta" }).success).toBe(false);
    expect(mediaSchema.parse({ name: "Tarjeta", tariff: 2.5, active: true }).tariff).toBe("2.5");
  });
  it("cambia el principal en la misma transacción sin dejar dos activos", async () => {
    await setStationMedia(1, 1, 1, true, true);
    await setStationMedia(1, 1, 2, true, true);
    expect(mock.rows.filter(row => row.es_principal && row.activo)).toHaveLength(1);
    expect(mock.rows.find(row => row.medio_acceso_id === 2)?.es_principal).toBe(true);
    expect(mock.transaction).toHaveBeenLastCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
    expect(mock.query).toHaveBeenCalledTimes(2);
  });
  it("marca automáticamente el único medio si no se indicó principal y respeta un No explícito", async () => {
    await setStationMedia(1, 1, 1, true);
    expect(mock.rows[0]?.es_principal).toBe(true);
    await setStationMedia(1, 1, 1, true, false);
    expect(mock.rows[0]?.es_principal).toBe(false);
  });
  it("al deshabilitar retira la condición principal y rechaza principal deshabilitado", async () => {
    await setStationMedia(1, 1, 1, true, true);
    await setStationMedia(1, 1, 1, false, false);
    expect(mock.rows[0]).toMatchObject({ activo: false, es_principal: false });
    await expect(setStationMedia(1, 1, 2, false, true)).rejects.toMatchObject({ statusCode: 400 });
  });
  it("calcula esperando × tarifa en centavos, sin usar abordajes ni ocupación", () => {
    expect(visitRevenue(375, [{ estacion_id: 1, medio_acceso: { nombre: "Tarjeta", tarifa: "2.50" } }]))
      .toMatchObject({ accesses: 375, medium: "Tarjeta", tariff: "2.50", estimatedRevenue: "937.50", configurationIssue: null });
    expect(visitRevenue(3, [{ estacion_id: 1, medio_acceso: { nombre: "Tarjeta", tarifa: "0.10" } }]).estimatedRevenue).toBe("0.30");
  });
  it("identifica estaciones sin principal y configuraciones ambiguas sin inventar valores", () => {
    expect(visitRevenue(80, [])).toMatchObject({ accesses: 80, medium: null, tariff: null, estimatedRevenue: null, configurationIssue: "Sin medio de pago principal" });
    const payment = { estacion_id: 1, medio_acceso: { nombre: "Tarjeta", tarifa: "2.50" } };
    expect(visitRevenue(80, [payment, payment]).estimatedRevenue).toBeNull();
  });
  it("enriquece varias estaciones con tarifas distintas e identifica las incompletas", async () => {
    mock.list.mockResolvedValue([
      { estacion_id: 1, medio_acceso: { nombre: "Tarjeta", tarifa: "2.50" } },
      { estacion_id: 2, medio_acceso: { nombre: "Efectivo", tarifa: "3.00" } },
    ]);
    const visits = await attachVisitRevenue([{ estacion_id: 1, demanda: 80 }, { estacion_id: 2, demanda: 375 }, { estacion_id: 3, demanda: 10 }]);
    expect(visits.map(visit => visit.revenue.estimatedRevenue)).toEqual(["200.00", "1125.00", null]);
    expect(visits[2]?.revenue.configurationIssue).toBe("Sin medio de pago principal");
  });
});
