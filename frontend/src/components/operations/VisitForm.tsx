import type { FormEvent } from "react";
import type { Trip, LineStation } from "../../types/operations.types";
import { arrivingPeople, previewVisit } from "../../utils/visit-passengers";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { OperationCard } from "./OperationCard";

interface VisitFormProps {
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
  demand, busy, canRecordNext, onTripChange, onPeopleOffChange, onPeopleBoardingChange, onDemandChange, onSubmit }: VisitFormProps) {
  const capacity = activeTrip?.bus.capacidad_maxima ?? 0;
  const arriving = arrivingPeople(activeTrip?.visitas ?? []);
  const preview = previewVisit(capacity, arriving, peopleOff, peopleBoarding, demand);
  const canEvaluate = Boolean(activeTrip && nextStation && preview.ready);

  return (
    <OperationCard eyebrow="VISITA" title="Registrar estación" icon="◔">
      <form className="work-form" onSubmit={onSubmit}>
        <label>
          Recorrido activo
          <Select value={selectedTrip} onChange={event => onTripChange(event.target.value)}
            required disabled={busy} placeholder="Selecciona un recorrido">
            {trips.filter(trip => trip.estado === "EN_CURSO").map(trip => (
              <option key={trip.id_recorrido} value={trip.id_recorrido}>{trip.linea.codigo} · bus {trip.bus.codigo}</option>
            ))}
          </Select>
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
          <span className="section-kicker">Personas que llegan en el bus</span>
          <strong>{activeTrip ? `${arriving} personas` : "Selecciona un recorrido"}</strong>
          <small className="field-help">Valor automático obtenido de la última visita guardada; en la primera estación llegan 0 personas.</small>
        </div>

        <div className="operations-form-row">
          <label>
            Personas que bajan
            <Input type="number" min="0" max={arriving} step="1" required value={peopleOff}
              disabled={busy} onChange={event => onPeopleOffChange(event.target.value)} />
          </label>
          <label>
            Personas esperando en la estación
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
            <strong>Capacidad del bus: {capacity} personas</strong>
            <p>{preview.error || "Ingresa cuántas personas bajan, esperan y abordan para realizar la evaluación."}</p>
          </div> : <>
            <span className="section-kicker">RESUMEN DE LA VISITA</span>
            <div className="visit-summary-metrics">
              <div><span>Capacidad del bus</span><strong>{capacity} personas</strong></div>
              <div><span>Llegan</span><strong>{arriving}</strong></div>
              <div><span>Bajan</span><strong>{preview.peopleOff}</strong></div>
              <div><span>Abordan</span><strong>{preview.peopleBoarding}</strong></div>
              <div><span>Ocupación al continuar</span><strong>{preview.occupancy} / {capacity} personas</strong></div>
              <div><span>Personas esperando</span><strong>{preview.waiting}</strong></div>
            </div>
            <div className="visit-evaluation">
              <span className="section-kicker">RESULTADO AUTOMÁTICO</span>
              <p className="field-help">Vista previa. El sistema confirma el resultado al guardar la visita.</p>
              <div className={`evaluation-item evaluation-item--${preview.requiresSupportUnit ? "warning" : "normal"}`}>
                <strong>{preview.requiresSupportUnit ? "Se requiere apoyo de otra unidad" : "No se requiere unidad de apoyo"}</strong>
                <p>{preview.requiresSupportUnit
                  ? "La cantidad de personas esperando alcanzó el nivel definido para generar una alerta de unidad adicional."
                  : "La cantidad de personas esperando permite continuar con la operación normal."}</p>
              </div>
              <div className={`evaluation-item evaluation-item--${preview.requiresExtraWait ? "warning" : "normal"}`}>
                <strong>{preview.requiresExtraWait ? "Se agregarán 5 minutos de espera" : "El recorrido puede continuar normalmente"}</strong>
                <p>{preview.requiresExtraWait
                  ? "La unidad lleva pocas personas, por lo que se registrará tiempo adicional antes de continuar."
                  : "La cantidad de personas dentro del bus no requiere tiempo adicional."}</p>
              </div>
            </div>
          </>}
        </div>
        {activeTrip && nextStation && !canRecordNext && <p className="field-help">Esta estación no está incluida en tus asignaciones.</p>}
        <Button variant="primary" type="submit" disabled={busy || !canRecordNext || !canEvaluate}>
          {busy ? "Guardando..." : "Guardar registro de estación"}
        </Button>
      </form>
    </OperationCard>
  );
}
