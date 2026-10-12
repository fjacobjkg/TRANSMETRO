import { OperationCard } from "./OperationCard";

interface VisitEvaluationPanelProps {
  canEvaluate: boolean;
  requiresSupportUnit: boolean;
  requiresExtraWait: boolean;
  embedded?: boolean;
}

export function VisitEvaluationPanel({ canEvaluate, requiresSupportUnit, requiresExtraWait,
  embedded = false }: VisitEvaluationPanelProps) {
  const content = <div className="visit-evaluation" aria-live="polite">
    {embedded && <span className="section-kicker">RESULTADO</span>}
    {!canEvaluate ? <div className="visit-summary-empty">
      <strong>Pendiente de evaluación</strong>
      <p>Completa los datos de la visita para conocer el resultado de la operación.</p>
    </div> : <>
      <p className="field-help">Revisa el resultado antes de registrar la visita.</p>
      <div className={`evaluation-item evaluation-item--${requiresSupportUnit ? "warning" : "normal"}`}>
        <strong>{requiresSupportUnit ? "Se necesita una unidad de apoyo" : "No se necesita una unidad de apoyo"}</strong>
        <p>{requiresSupportUnit
          ? "Hay una cantidad elevada de personas esperando en esta estación."
          : "La cantidad de personas esperando se encuentra dentro del nivel normal."}</p>
      </div>
      <div className={`evaluation-item evaluation-item--${requiresExtraWait ? "warning" : "normal"}`}>
        <strong>{requiresExtraWait ? "Se agregarán 5 minutos de espera" : "El recorrido puede continuar"}</strong>
        <p>{requiresExtraWait
          ? "La unidad lleva pocas personas antes de continuar el recorrido."
          : "La ocupación actual no requiere tiempo adicional de espera."}</p>
      </div>
    </>}
  </div>;

  if (embedded) return content;
  return <OperationCard eyebrow="RESULTADO" title="Evaluación de la visita" icon="◔" className="visit-evaluation-panel">
    {content}
  </OperationCard>;
}
