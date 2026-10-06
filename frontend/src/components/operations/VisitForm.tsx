import type { FormEvent } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { OperationCard } from "./OperationCard";
import type { Trip } from "../../types/operations.types";
export function VisitForm({ trips, selectedTrip, activeTrip, nextStation, occupancy, demand, busy, canRecordNext, onTripChange, onOccupancyChange, onDemandChange, onSubmit }: {
  trips: Trip[]; selectedTrip: string; activeTrip?: Trip;
  nextStation?: { estacion_id: number; orden: number; estacion: { codigo: string; nombre: string } };
  occupancy: string; demand: string; busy: boolean; canRecordNext: boolean;
  onTripChange: (value: string) => void; onOccupancyChange: (value: string) => void; onDemandChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return <OperationCard eyebrow="VISITA" title="Registrar estación" icon="◷"><form className="work-form" onSubmit={onSubmit}>
    <label>Recorrido abierto<Select value={selectedTrip} onChange={(event) => onTripChange(event.target.value)} required placeholder="Selecciona un recorrido">
      {trips.filter((trip) => trip.estado === "EN_CURSO").map((trip) => <option key={trip.id_recorrido} value={trip.id_recorrido}>{trip.linea.codigo} · bus {trip.bus.codigo}</option>)}
    </Select></label>
    <div className="next-stop"><span>SIGUIENTE ESTACIÓN</span><strong>{nextStation?.estacion.nombre ?? (activeTrip ? "Recorrido completo" : "—")}</strong>
      {nextStation && <small>{nextStation.estacion.codigo} · parada {nextStation.orden}</small>}</div>
    <div className="form-row">
      <label>Ocupación<Input type="number" min="0" step="1" value={occupancy} onChange={(event) => onOccupancyChange(event.target.value)} required /></label>
      <label>Demanda<Input type="number" min="0" step="1" value={demand} onChange={(event) => onDemandChange(event.target.value)} required /></label>
    </div>
    {activeTrip && <div className="capacity-preview">Capacidad: <strong>{activeTrip.bus.capacidad_maxima} personas</strong>
      {demand !== "" && Number(demand) >= activeTrip.bus.capacidad_maxima * 1.5 && <p>Demanda ≥ 150 %: se registrará una alerta de unidad adicional.</p>}
      {occupancy !== "" && Number(occupancy) < activeTrip.bus.capacidad_maxima * .25 && <p>Ocupación &lt; 25 %: se registrarán 5 minutos adicionales de espera.</p>}
      {!canRecordNext && nextStation && <p>La siguiente estación requiere un operador asignado a ella.</p>}</div>}
    <Button variant="primary" type="submit" disabled={busy || !activeTrip || !canRecordNext}>{busy ? "Guardando…" : "Guardar visita"}</Button>
  </form></OperationCard>;
}
