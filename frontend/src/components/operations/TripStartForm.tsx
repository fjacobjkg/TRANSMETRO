import type { FormEvent } from "react";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { OperationCard } from "./OperationCard";
import type { Line, Trip } from "../../types/operations.types";
export function TripStartForm({ lines, trips, line, selectedLine, selectedBus, busy, onLineChange, onBusChange, onSubmit }: {
  lines: Line[]; trips: Trip[]; line?: Line; selectedLine: string; selectedBus: string; busy: boolean;
  onLineChange: (value: string) => void; onBusChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return <OperationCard eyebrow="NUEVO RECORRIDO" title="Iniciar operación" icon="↗"><form className="work-form" onSubmit={onSubmit}>
    <label>Línea<Select value={selectedLine} onChange={(event) => onLineChange(event.target.value)} required placeholder="Selecciona una línea">
      {lines.map((item) => <option key={item.id_linea} value={item.id_linea}>{item.codigo} · {item.nombre}</option>)}
    </Select></label>
    <label>Bus asignado<Select value={selectedBus} onChange={(event) => onBusChange(event.target.value)} required placeholder="Selecciona un bus">
      {line?.asignaciones_bus.map(({ bus }) => {
        const inTrip = trips.some((trip) => trip.estado === "EN_CURSO" && trip.bus.id_bus === bus.id_bus);
        return <option disabled={inTrip} key={bus.id_bus} value={bus.id_bus}>{bus.codigo} · {bus.capacidad_maxima} plazas{inTrip ? " · En recorrido" : ""}</option>;
      })}
    </Select></label>
    <Button variant="primary" type="submit" disabled={busy || !line || !selectedBus}>{busy ? "Guardando…" : "Iniciar recorrido"}</Button>
  </form></OperationCard>;
}
