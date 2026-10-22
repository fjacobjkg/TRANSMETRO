import type { FormEvent } from "react";
import { Button } from "../ui/Button";
import { SearchableSelect } from "../ui/SearchableSelect";
import { OperationCard } from "./OperationCard";
import type { Line, Trip } from "../../types/operations.types";
import { availableOperationBuses } from "../../utils/operation-availability";
export function TripStartForm({ lines, trips, line, selectedLine, selectedBus, busy, onLineChange, onBusChange, onSubmit }: {
  lines: Line[]; trips: Trip[]; line?: Line; selectedLine: string; selectedBus: string; busy: boolean;
  onLineChange: (value: string) => void; onBusChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return <OperationCard eyebrow="NUEVO RECORRIDO" title="Iniciar recorrido" description="Selecciona la línea y una unidad disponible para comenzar." icon="↗" className="trip-start-card"><form className="work-form" onSubmit={onSubmit}>
    <label>Línea<SearchableSelect value={selectedLine} onChange={onLineChange} required placeholder="Selecciona una línea"
      options={lines.map(item => ({ value: String(item.id_linea), label: `${item.codigo} · ${item.nombre}` }))} /></label>
    <label>Bus disponible<SearchableSelect value={selectedBus} onChange={onBusChange} required placeholder="Selecciona un bus"
      options={availableOperationBuses(line ? [line] : [], trips).map(bus =>
        ({ value: String(bus.id_bus), label: `${bus.codigo} · ${bus.capacidad_maxima} pasajeros` }))} /></label>
    <Button variant="primary" type="submit" disabled={busy || !line || !selectedBus}>{busy ? "Guardando…" : "Iniciar recorrido"}</Button>
  </form></OperationCard>;
}
