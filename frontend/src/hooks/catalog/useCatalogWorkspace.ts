import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../AuthContext";
import type { Row } from "../../types/table.types";
import { resourcesBySection } from "../../config/catalog/resources";
import type { Resource } from "../../types/catalog.types";
import { catalogFormFields } from "../../config/catalog/form-fields";
import { relations } from "../../config/catalog/relations";
import { getCatalogLookups, getCatalogRows, saveCatalogEntry } from "../../services/catalog/catalog.service";
import { isFrontendRoleEnabled, enabledCatalogRows, catalogPageMessage, DISABLED_ROLE_MESSAGE } from "../../config/features";

const fieldToColumn: Record<string, string> = {
  name: "nombre", code: "codigo", plate: "placa", capacity: "capacidad_maxima",
  municipalityId: "municipalidad_id", stationId: "estacion_id", residence: "residencia",
  education: "informacion_educativa", phone: "telefono", email: "correo", description: "descripcion",
  tariff: "tarifa",
};
function rowId(row: Row) {
  return Object.entries(row).find(([key]) => key.startsWith("id_"))?.[1];
}

export function useCatalogWorkspace(section: string, resourceKeys?: string[]) {
  const { user } = useAuth();
  const resources = useMemo(() => (resourcesBySection[section] ?? [])
    .filter(resource => !resourceKeys || resourceKeys.includes(resource.key)), [section, resourceKeys]);
  const [selected, setSelected] = useState(resources[0]?.key ?? "");
  const resource = resources.find((item) => item.key === selected) ?? resources[0];
  const [rows, setRows] = useState<Row[]>([]);
  const visibleRows = useMemo(() => enabledCatalogRows(resource?.key ?? "", rows), [resource, rows]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [lookups, setLookups] = useState<Record<string, Row[]>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [formResource, setFormResource] = useState<Resource | null>(null);
  const target = formResource ?? resource;

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!resource) return;
    setBusy(true);
    setError("");
    try {
      const result = await getCatalogRows(resource.path, signal);
      setRows(result.items ?? []);
      setMessage(catalogPageMessage(resource.key, result.items ?? [], result.total));
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "No fue posible cargar.");
    } finally {
      if (!signal?.aborted) setBusy(false);
    }
  }, [resource]);

  useEffect(() => {
    setRows([]); setValues({}); setEditing(null); setFormOpen(false); setFormResource(null); setMessage("");
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!target) return;
    const controller = new AbortController();
    setLookups({});
    void getCatalogLookups(target, controller.signal).then(setLookups)
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [target]);


  const canWrite = user?.role === "ADMIN" && Boolean(resource?.method);
  function openForm(row: Row | null = null, formTarget = resource, initialValues: Record<string, string> = {}) {
    if (!formTarget?.method || user?.role !== "ADMIN") return;
    setFormResource(formTarget);
    setEditing(row);
    setValues(row ? { ...Object.fromEntries((formTarget.fields ?? []).map((field) => [
      field.name, String(row[fieldToColumn[field.name] ?? field.name] ?? ""),
    ])), active: String(row.activo) } : initialValues);
    setError("");
    setFormOpen(true);
  }
  const formFields = catalogFormFields(target, editing);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target?.method || user?.role !== "ADMIN") return;
    setBusy(true); setError(""); setMessage("");
    try {
      if (values.role && !isFrontendRoleEnabled(values.role)) throw new Error(DISABLED_ROLE_MESSAGE);
      if (target.key === "update-user" && !values.role && !values.active) {
        throw new Error("Selecciona un cambio de rol o estado.");
      }
      const body = target.body && !editing ? target.body(values)
        : Object.fromEntries(formFields
          .filter((field) => !field.pathOnly && (Boolean(values[field.name]) ||
            Boolean(editing && !field.required && ["phone", "email", "description", "education"].includes(field.name))))
          .map((field) => [field.name, !values[field.name] ? null
            : ["active", "isPrincipal"].includes(field.name) ? values[field.name] === "true"
              : field.kind === "number" || relations[field.name] ? Number(values[field.name]) : values[field.name]]));
      const path = editing ? target.path.split("?")[0] + "/" + rowId(editing)
        : target.writePath?.(values) ?? target.path;
      await saveCatalogEntry(path, editing ? "PATCH" : target.method, body);
      setFormOpen(false);
      setFormResource(null);
      await load();
      setMessage("Cambios guardados. La operación quedó registrada en la bitácora.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar.");
    } finally { setBusy(false); }
  }

  return {
    user, resources, resource, selected, setSelected, rows: visibleRows, values, setValues, lookups,
    error, message, busy, formOpen, setFormOpen, editing, formFields, formResource: target, canWrite, openForm, submit,
    closeForm: () => { if (!busy) { setFormOpen(false); setFormResource(null); } },
    refresh: () => void load(),
  };
}
