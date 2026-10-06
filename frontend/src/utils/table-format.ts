import type { Row } from "../types/table.types";

export function textValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? 'Activo' : 'Inactivo';
  if (Array.isArray(value)) return value.map(textValue).join(' · ') || 'Sin asignación';
  if (typeof value === 'object') {
    const row = value as Row;
    if (row.estacion) return textValue(row.estacion);
    if (row.bus) return textValue(row.bus);
    if (row.linea) return textValue(row.linea);
    if (row.parqueo) return textValue(row.parqueo);
    if (row.guardia) return textValue(row.guardia);
    return String(row.nombre ?? row.name ?? row.codigo ?? row.code ?? '');
  }
  return String(value);
}
