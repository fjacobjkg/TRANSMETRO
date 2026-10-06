import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import type { Trip } from "../../types/operations.types";
export function CancelTripDialog({ trip, busy, onClose, onConfirm }: { trip: Trip | null; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!trip) return null;
  return <Dialog title="Cancelar recorrido" onClose={onClose}>
    <p>El recorrido del bus <strong>{trip.bus.codigo}</strong> en <strong>{trip.linea.nombre}</strong> se cerrará como cancelado. Las visitas ya registradas se conservarán.</p>
    <div className="form-footer"><Button disabled={busy} onClick={onClose}>Volver</Button>
      <Button variant="danger" disabled={busy} onClick={onConfirm}>{busy ? "Guardando…" : "Confirmar cancelación"}</Button></div>
  </Dialog>;
}
