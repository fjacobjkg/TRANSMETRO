export type StationPayment = { estacion_id: number; medio_acceso: { nombre: string; tarifa: { toString(): string } | string | number } };

export function moneyCents(value: string): bigint {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(value)) throw new RangeError("La tarifa debe tener como máximo dos decimales.");
  const [whole, fraction = ""] = value.split(".");
  const cents = BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (cents <= 0n) throw new RangeError("La tarifa debe ser mayor que cero.");
  return cents;
}
export function moneyString(cents: bigint): string {
  return `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
}
export function visitRevenue(demand: number, payments: StationPayment[]) {
  if (payments.length !== 1) return { accesses: demand, medium: null, tariff: null, estimatedRevenue: null,
    configurationIssue: payments.length > 1 ? "Más de un medio de pago principal" : "Sin medio de pago principal" };
  const medium = payments[0]!.medio_acceso;
  const cents = moneyCents(String(medium.tarifa));
  return { accesses: demand, medium: medium.nombre, tariff: moneyString(cents),
    estimatedRevenue: moneyString(BigInt(demand) * cents), configurationIssue: null };
}
