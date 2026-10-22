import type { FormEvent } from "react";
import type { Trip, LineStation } from "../../types/operations.types";
import { arrivingPeople, previewVisit } from "../../utils/visit-passengers";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { SearchableSelect } from "../ui/SearchableSelect";
import { OperationCard } from "./OperationCard";
import { VisitEvaluationPanel } from "./VisitEvaluationPanel";

interface VisitFormProps {
  separateEvaluation?: boolean;
  trips: Trip[];
  selectedTrip: string;
  activeTrip?: Trip;
  nextStation?: LineStation;
  peopleOff: string;
  peopleBoarding: string;
  demand: string;
  busy: boolean;
  canRecordNext: boolean;
  onTripChange: (value: string) => void;
  onPeopleOffChange: (value: string) => void;
  onPeopleBoardingChange: (value: string) => void;
  onDemandChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function VisitForm({ trips, selectedTrip, activeTrip, nextStation, peopleOff, peopleBoarding,
  demand, busy, canRecordNext, onTripChange, onPeopleOffChange, onPeopleBoardingChange, onDemandChange, onSubmit,
  separateEvaluation = false }: VisitFormProps) {
  const capacity = activeTrip?.bus.capacidad_maxima ?? 0;
  const arriving = arrivingPeople(activeTrip?.visitas ?? []);
  const preview = previewVisit(capacity, arriving, peopleOff, peopleBoarding, demand);
  const canEvaluate = Boolean(activeTrip && nextStation && preview.ready);

  const form = (
    <OperationCard eyebrow="VISITA" title="Registrar visita" description="Registra el movimiento de pasajeros cuando la unidad llega a tu estación." icon="◔" className="visit-form-card">
      <form className="work-form" onSubmit={onSubmit}>
        <label>
          Recorrido activo
          <SearchableSelect value={selectedTrip} onChange={onTripChange}
            required disabled={busy} placeholder="Selecciona un recorrido"
            options={trips.filter(trip => trip.estado === "EN_CURSO").map(trip =>
              ({ value: String(trip.id_recorrido), label: `${trip.linea.codigo} · bus ${trip.bus.codigo}` }))} />
        </label>

        <div className="next-station-box">
          <span className="section-kicker">PRÓXIMA ESTACIÓN</span>
          <div className="next-station-info">
            <strong className="next-station-name">{nextStation?.estacion.nombre ?? "Sin estación pendiente"}</strong>
            <span className="next-station-detail">{nextStation
              ? `${nextStation.estacion.codigo} · parada ${nextStation.orden}`
              : "Selecciona un recorrido abierto con estaciones pendientes."}</span>
          </div>
        </div>

        <div className="visit-summary-box">
          <span className="section-kicker">Personas a bordo al llegar</span>
          <strong>{activeTrip ? `${arriving} personas` : "Selecciona un recorrido"}</strong>
          <small className="field-help">{activeTrip?.visitas.length ? "Este valor proviene de la visita anterior." : "El recorrido inicia con 0 personas a bordo."}</small>
        </div>

        <div className="operations-form-row">
          <label>
            Personas que bajan
            <Input type="number" min="0" max={arriving} step="1" required value={peopleOff}
              disabled={busy} onChange={event => onPeopleOffChange(event.target.value)} />
          </label>
          <label>
            Personas esperando
            <Input type="number" min="0" max="4294967295" step="1" required value={demand}
              disabled={busy} onChange={event => onDemandChange(event.target.value)} />
          </label>
          <label>
            Personas que abordan
            <Input type="number" min="0" max={demand.trim() !== "" && Number(demand) >= 0 ? Number(demand) : undefined}
              step="1" required value={peopleBoarding} disabled={busy}
              onChange={event => onPeopleBoardingChange(event.target.value)} />
          </label>
        </div>

        <div className="visit-summary-box" aria-live="polite">
          {!activeTrip ? <div className="visit-summary-empty">
            <strong>Selecciona un recorrido</strong>
            <p>Elige la unidad que llegó a tu estación para registrar la visita.</p>
          </div> : !canEvaluate || !preview.ready ? <div className="visit-summary-empty">
            <strong>Capacidad del bus: {capacity} pasajeros</strong>
            <p>{preview.error || "Ingresa cuántas personas bajan, esperan y abordan para realizar la evaluación."}</p>
          </div> : <>
            <span className="section-kicker">RESUMEN DE LA VISITA</span>
            <div className="visit-summary-metrics">
              <div><span>Capacidad</span><strong>{capacity} pasajeros</strong></div>
              <div><span>A bordo al llegar</span><strong>{arriving}</strong></div>
              <div><span>Bajan</span><strong>{preview.peopleOff}</strong></div>
              <div><span>Abordan</span><strong>{preview.peopleBoarding}</strong></div>
              <div><span>Personas a bordo al salir</span><strong>{preview.occupancy} / {capacity}</strong></div>
              <div><span>En espera</span><strong>{preview.waiting}</strong></div>
            </div>
            {!separateEvaluation && <VisitEvaluationPanel embedded canEvaluate={canEvaluate}
              requiresSupportUnit={preview.requiresSupportUnit} requiresExtraWait={preview.requiresExtraWait} />}
          </>}
        </div>
        {activeTrip && nextStation && !canRecordNext && <p className="field-help">Esta estación no está incluida en tus asignaciones.</p>}
        <Button variant="primary" type="submit" disabled={busy || !canRecordNext || !canEvaluate}>
          {busy ? "Guardando..." : "Registrar visita"}
        </Button>
      </form>
    </OperationCard>
  );

  if (!separateEvaluation) return form;
  return <div className="visit-workspace">
    {form}
    <VisitEvaluationPanel canEvaluate={canEvaluate}
      requiresSupportUnit={preview.ready ? preview.requiresSupportUnit : false}
      requiresExtraWait={preview.ready ? preview.requiresExtraWait : false} />
  </div>;
}
