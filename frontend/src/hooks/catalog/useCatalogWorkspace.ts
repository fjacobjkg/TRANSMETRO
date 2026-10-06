import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../AuthContext";
import type { Row } from "../../types/table.types";
import { resourcesBySection } from "../../config/catalog/resources";
import type { Field } from "../../types/catalog.types";
import { relations } from "../../config/catalog/relations";
import { getCatalogLookups, getCatalogRows, saveCatalogEntry } from "../../services/catalog/catalog.service";

const fieldToColumn: Record<string, string> = {
  name: "nombre", code: "codigo", plate: "placa", capacity: "capacidad_maxima",
  municipalityId: "municipalidad_id", stationId: "estacion_id", residence: "residencia",
  education: "informacion_educativa", phone: "telefono", email: "correo", description: "descripcion",
};
function rowId(row: Row) {
  return Object.entries(row).find(([key]) => key.startsWith("id_"))?.[1];
}

export function useCatalogWorkspace(section: string) {
  const { user } = useAuth();
  const resources = resourcesBySection[section] ?? [];
  const [selected, setSelected] = useState(resources[0]?.key ?? "");
  const resource = resources.find((item) => item.key === selected) ?? resources[0];
  const [rows, setRows] = useState<Row[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [lookups, setLookups] = useState<Record<string, Row[]>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!resource) return;
    setBusy(true);
    setError("");
    try {
      const result = await getCatalogRows(resource.path, signal);
      setRows(result.items ?? []);
      if (result.total && result.total > (result.items?.length ?? 0)) {
        setMessage("Se muestran los primeros " + result.items?.length + " registros de " + result.total + ".");
      }
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "No fue posible cargar.");
    } finally {
      if (!signal?.aborted) setBusy(false);
    }
  }, [resource]);

  useEffect(() => {
    setRows([]); setValues({}); setEditing(null); setFormOpen(false); setMessage("");
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!resource) return;
    const controller = new AbortController();
    void getCatalogLookups(resource, controller.signal).then(setLookups)
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [resource]);


  const canWrite = user?.role === "ADMIN" && Boolean(resource?.method);
  function openForm(row: Row | null = null) {
    setEditing(row);
    setValues(row ? { ...Object.fromEntries((resource?.fields ?? []).map((field) => [
      field.name, String(row[fieldToColumn[field.name] ?? field.name] ?? ""),
    ])), active: String(row.activo) } : {});
    setError("");
    setFormOpen(true);
  }
  const formFields: Field[] = [
    ...(resource?.fields ?? []).filter((field) => !editing || !["parkingId", "stationId", "code"].includes(field.name)),
    ...(editing ? [{ name: "active", label: "Estado", kind: "select" as const,
      options: [{ label: "Activo", value: "true" }, { label: "Inactivo", value: "false" }] }] : []),
  ];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resource) return;
    setBusy(true); setError(""); setMessage("");
    try {
      if (resource.key === "update-user" && !values.role && !values.active) {
        throw new Error("Selecciona un cambio de rol o estado.");
      }
      const body = resource.body && !editing ? resource.body(values)
        : Object.fromEntries(formFields
          .filter((field) => !field.pathOnly && (Boolean(values[field.name]) ||
            Boolean(editing && !field.required && ["phone", "email", "description", "education"].includes(field.name))))
          .map((field) => [field.name, !values[field.name] ? null
            : field.name === "active" ? values.active === "true"
              : field.kind === "number" || relations[field.name] ? Number(values[field.name]) : values[field.name]]));
      const path = editing ? resource.path.split("?")[0] + "/" + rowId(editing)
        : resource.writePath?.(values) ?? resource.path;
      await saveCatalogEntry(path, editing ? "PATCH" : resource.method, body);
      setFormOpen(false);
      await load();
      setMessage("Cambios guardados. La operación quedó registrada en la bitácora.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar.");
    } finally { setBusy(false); }
  }

  return {
    user, resources, resource, selected, setSelected, rows, values, setValues, lookups,
    error, message, busy, formOpen, setFormOpen, editing, formFields, canWrite, openForm, submit,
    refresh: () => void load(),
  };
}
