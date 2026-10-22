import { useState } from "react";
import type { Row } from "../../types/table.types";
import { endAccessGuardAssignment } from "../../services/catalog/catalog.service";
import { Button } from "../ui/Button";
import { DataTable, textValue } from "../ui/DataTable";
import { Dialog } from "../ui/Dialog";
import { Notice } from "../ui/PageHeader";

export function AccessGuardAssignments({ access, disabled, onSaved }: {
  access: Row; disabled: boolean; onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const assignments = (access.asignaciones_guardia ?? []) as Row[];

  async function finish() {
    if (!selected || busy) return;
    setBusy(true); setError("");
    try {
      await endAccessGuardAssignment(Number(selected.id_asignacion_guardia_acceso));
      setSelected(null); setOpen(false); onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible finalizar la asignación.");
    } finally { setBusy(false); }
  }

  if (!assignments.length) return null;
  return <>
    <Button variant="quiet" disabled={disabled || busy} onClick={() => {
      setSelected(null); setError(""); setOpen(true);
    }}>Asignaciones de guardias ({assignments.length})</Button>
    {open && <Dialog title={`Asignaciones de guardias · ${String(access.nombre)}`}
      onClose={() => { if (!busy) setOpen(false); }}>
      <p className="muted">Estación: {textValue(access.estacion)}. Finalizar una asignación conserva su historial y no elimina al guardia.</p>
      {access.activo === true && <p className="muted">El acceso activo debe conservar al menos un guardia vigente.</p>}
      <Notice error={error} />
      <DataTable rows={assignments} showSearch={false} columns={[
        { key: "guardia", label: "Guardia", render: row => textValue(row.guardia) },
        { key: "fecha_inicio", label: "Desde", render: row => new Date(String(row.fecha_inicio)).toLocaleString("es-GT") },
      ]} actions={row => <Button variant="quiet" disabled={busy} onClick={() => {
        setSelected(row); setError("");
      }} aria-label={`Finalizar asignación de ${textValue(row.guardia)}`}>Finalizar asignación</Button>} />
      {selected && <>
        <p>¿Finalizar la asignación de <strong>{textValue(selected.guardia)}</strong> a <strong>{String(access.nombre)}</strong>?</p>
        <p className="muted">Se registrará la fecha de finalización. El guardia permanecerá en el catálogo.</p>
        <div className="form-footer">
          <Button disabled={busy} onClick={() => { setSelected(null); setError(""); }}>Cancelar</Button>
          <Button variant="danger" disabled={busy} onClick={() => void finish()}>
            {busy ? "Finalizando…" : "Finalizar asignación"}
          </Button>
        </div>
      </>}
    </Dialog>}
  </>;
}
