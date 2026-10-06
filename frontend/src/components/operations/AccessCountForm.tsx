import type { FormEvent } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { OperationCard } from "./OperationCard";
import type { AccessCount, MediaOption } from "../../types/operations.types";
export function AccessCountForm({ stationOptions, stationNames, stationId, media, selectedMedia, accessCounts, userId, quantity, busy, onStationChange, onMediaChange, onQuantityChange, onSubmit }: {
  stationOptions: number[]; stationNames: Map<number, string>; stationId: string; media: MediaOption[];
  selectedMedia: string; accessCounts: AccessCount[]; userId?: number; quantity: string; busy: boolean;
  onStationChange: (value: string) => void; onMediaChange: (value: string) => void; onQuantityChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const existing = accessCounts.find((entry) => entry.estacion_medio_acceso_id === Number(selectedMedia) && entry.usuario_id === userId);
  return <OperationCard eyebrow="MEDIOS DE ACCESO" title="Registrar conteo diario" icon="▤"><form className="work-form" onSubmit={onSubmit}>
    <label>Estación<Select value={stationId} onChange={(event) => onStationChange(event.target.value)} required placeholder="Selecciona una estación">
      {stationOptions.map((id) => <option key={id} value={id}>{stationNames.get(id) ?? `Estación ${id}`}</option>)}
    </Select></label>
    <label>Medio habilitado<Select value={selectedMedia} onChange={(event) => onMediaChange(event.target.value)} required placeholder="Selecciona un medio">
      {media.map((item) => <option key={item.id_estacion_medio_acceso} value={item.id_estacion_medio_acceso}>{item.medio_acceso.nombre}</option>)}
    </Select></label>
    {existing && <div className="existing-count">Conteo de hoy: <strong>{existing.cantidad}</strong> · Guardar actualizará este valor y dejará auditoría.</div>}
    <label>{existing ? "Cantidad corregida" : "Cantidad registrada"}<Input type="number" min="0" step="1" value={quantity} onChange={(event) => onQuantityChange(event.target.value)} required /></label>
    <Button variant="primary" type="submit" disabled={busy || !selectedMedia}>{busy ? "Guardando…" : "Guardar conteo"}</Button>
  </form></OperationCard>;
}
