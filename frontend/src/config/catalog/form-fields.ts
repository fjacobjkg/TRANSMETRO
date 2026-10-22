import type { Field, Resource } from "../../types/catalog.types";
import type { Row } from "../../types/table.types";

export function catalogFormFields(resource: Resource | undefined, editing: Row | null): Field[] {
  return [
    ...(resource?.fields ?? []).filter(field => !editing ||
      (field.name === "stationId" && resource?.key === "accesses"
        ? editing.activo === false
        : !["parkingId", "stationId", "code"].includes(field.name))),
    ...(editing && !resource?.fields?.some(field => field.name === "active") ? [{
      name: "active", label: "Estado", kind: "select" as const,
      options: [{ label: "Activo", value: "true" }, { label: "Inactivo", value: "false" }],
    }] : []),
  ];
}
