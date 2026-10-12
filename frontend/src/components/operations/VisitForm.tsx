import type { FormEvent } from "react";
import type { Trip, LineStation } from "../../types/operations.types";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { OperationCard } from "./OperationCard";


export function VisitForm({
  trips,
  selectedTrip,
  activeTrip,
  nextStation,
  occupancy,
  demand,
  busy,
  canRecordNext,
  onTripChange,
  onOccupancyChange,
  onDemandChange,
  onSubmit,
}: {
  trips: Trip[];
  selectedTrip: string;
  activeTrip?: Trip;
  nextStation?: LineStation;
  occupancy: string;
  demand: string;
  busy: boolean;
  canRecordNext: boolean;
  onTripChange: (value: string) => void;
  onOccupancyChange: (value: string) => void;
  onDemandChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  /* ========================================
     DATOS DEL BUS
  ======================================== */

  const capacity =
    Number(
      activeTrip?.bus?.capacidad_maxima ?? 0,
    );


  /* ========================================
     DATOS INGRESADOS
  ======================================== */

  const hasOccupancy =
    occupancy.trim() !== "";

  const hasDemand =
    demand.trim() !== "";

  const occupancyValue =
    hasOccupancy
      ? Number(occupancy)
      : 0;

  const demandValue =
    hasDemand
      ? Number(demand)
      : 0;


  /* ========================================
     EVALUACIÓN
  ======================================== */

  const canEvaluate =
    Boolean(activeTrip) &&
    capacity > 0 &&
    hasOccupancy &&
    hasDemand &&
    Number.isInteger(occupancyValue) && occupancyValue >= 0 &&
    Number.isInteger(demandValue) && demandValue >= 0;


  const occupancyPercent =
    canEvaluate
      ? Math.round(
          (occupancyValue / capacity) * 100,
        )
      : 0;


  const demandPercent =
    canEvaluate
      ? Math.round(
          (demandValue / capacity) * 100,
        )
      : 0;


  const requiresSupportUnit =
    canEvaluate &&
    demandValue >= capacity * 1.5;


  const requiresExtraWait =
    canEvaluate &&
    occupancyValue < capacity * 0.25;


  /* ========================================
     RENDER
  ======================================== */

  return (
    <OperationCard
      eyebrow="VISITA"
      title="Registrar estación"
      icon="◔"
    >
      <form
        className="work-form"
        onSubmit={onSubmit}
      >

        {/* RECORRIDO */}
        <label>
          Recorrido activo

          <Select
            value={selectedTrip}
            onChange={(event) =>
              onTripChange(
                event.target.value,
              )
            }
            required
            placeholder="Selecciona un recorrido"
          >
            {trips
              .filter(
                (trip) =>
                  trip.estado === "EN_CURSO",
              )
              .map((trip) => (
                <option
                  key={trip.id_recorrido}
                  value={trip.id_recorrido}
                >
                  {trip.linea.codigo}
                  {" · "}
                  bus {trip.bus.codigo}
                </option>
              ))}
          </Select>
        </label>


       {/* PRÓXIMA ESTACIÓN */}
        <div className="next-station-box">

          <span className="section-kicker">
            PRÓXIMA ESTACIÓN
          </span>

          {nextStation ? (
            <div className="next-station-info">

              <strong className="next-station-name">
                {nextStation.estacion.nombre}
              </strong>

              <span className="next-station-detail">
                {nextStation.estacion.codigo ?? ""}
                {" · "}
                parada {nextStation.orden}
              </span>

            </div>
          ) : (
            <div className="next-station-info">

              <strong className="next-station-name">
                Sin estación pendiente
              </strong>

              <span className="next-station-detail">
                No hay más estaciones por registrar
                en este recorrido.
              </span>

            </div>
          )}

        </div>

        {/* DATOS DE LA VISITA */}
        <div className="operations-form-row">

          <label>
            Personas dentro del bus

            <Input
              type="number"
              min="0"
              step="1"
              value={occupancy}
              onChange={(event) =>
                onOccupancyChange(
                  event.target.value,
                )
              }
              required
            />

            <small className="field-help">
              Cantidad de personas que viajan
              actualmente en la unidad.
            </small>
          </label>


          <label>
            Personas esperando en la estación

            <Input
              type="number"
              min="0"
              step="1"
              value={demand}
              onChange={(event) =>
                onDemandChange(
                  event.target.value,
                )
              }
              required
            />

            <small className="field-help">
              Cantidad de personas que esperan
              abordar el bus.
            </small>
          </label>

        </div>


        {/* EVALUACIÓN */}
        <div className="visit-summary-box">

          {!activeTrip ? (

            <div className="visit-summary-empty">

              <strong>
                Selecciona un recorrido
              </strong>

              <p>
                Elige un recorrido abierto para
                consultar la capacidad de la
                unidad y registrar la visita.
              </p>

            </div>

          ) : !canEvaluate ? (

            <div className="visit-summary-empty">

              <strong>
                Capacidad del bus:{" "}
                {capacity} personas
              </strong>

              <p>
                Ingresa los datos de la estación para realizar la evaluación.
                La capacidad del bus debe estar disponible y las cantidades deben ser enteros no negativos.
              </p>

              <p>
                El sistema evaluará
                automáticamente si se necesita
                una unidad de apoyo o tiempo
                adicional de espera.
              </p>

            </div>

          ) : (

            <>
              {/* RESUMEN */}
              <div className="visit-summary-metrics">

                <div>
                  <span>
                    Capacidad del bus
                  </span>

                  <strong>
                    {capacity} personas
                  </strong>
                </div>


                <div>
                  <span>
                    Personas dentro del bus
                  </span>

                  <strong>
                    {occupancyValue}
                  </strong>

                  <small>
                    {occupancyPercent}% de
                    ocupación
                  </small>
                </div>


                <div>
                  <span>
                    Personas esperando
                  </span>

                  <strong>
                    {demandValue}
                  </strong>

                  <small>
                    Equivale al {demandPercent}%
                    de la capacidad
                  </small>
                </div>

              </div>


              {/* RESULTADO */}
              <div className="visit-evaluation">

                <span className="section-kicker">
                  RESULTADO AUTOMÁTICO
                </span>
                <p className="field-help">Vista previa. El sistema confirma el resultado al guardar la visita.</p>


                {requiresSupportUnit ? (
                  <div className="evaluation-item evaluation-item--warning">

                    <strong>
                      Se requiere apoyo de otra
                      unidad
                    </strong>

                    <p>
                      Hay una cantidad alta de
                      personas esperando en esta
                      estación. El sistema
                      registrará una alerta de
                      unidad adicional.
                    </p>

                  </div>
                ) : (
                  <div className="evaluation-item evaluation-item--normal">

                    <strong>
                      No se requiere unidad de
                      apoyo
                    </strong>

                    <p>
                      La cantidad de personas
                      esperando permite continuar
                      con la operación normal.
                    </p>

                  </div>
                )}


                {requiresExtraWait ? (
                  <div className="evaluation-item evaluation-item--warning">

                    <strong>
                      Se agregarán 5 minutos de
                      espera
                    </strong>

                    <p>
                      La unidad lleva pocas
                      personas, por lo que se
                      registrará tiempo adicional
                      antes de continuar.
                    </p>

                  </div>
                ) : (
                  <div className="evaluation-item evaluation-item--normal">

                    <strong>
                      El recorrido puede continuar
                      normalmente
                    </strong>

                    <p>
                      La cantidad de personas
                      dentro del bus no requiere
                      tiempo adicional.
                    </p>

                  </div>
                )}

              </div>
            </>

          )}

        </div>


        {/* GUARDAR */}
        <Button
          variant="primary"
          type="submit"
          disabled={
            busy ||
            !canRecordNext ||
            !activeTrip ||
            !nextStation ||
            !canEvaluate
          }
        >
          {busy
            ? "Guardando..."
            : "Guardar registro de estación"}
        </Button>

      </form>
    </OperationCard>
  );
}