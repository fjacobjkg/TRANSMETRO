import type { FormEvent } from "react";
import { Button } from "../ui/Button";
import { relations, optionLabel } from "../../config/catalog/relations";
import type { Row } from "../ui/DataTable";
import type { ReportKind } from "../../types/reports.types";

const keysByKind: Partial<Record<ReportKind, string[]>> = {
  operations: ["lineId", "stationId", "busId"],
  fleet: ["lineId", "busId"],
  "access-counts": ["stationId"],
};
export function ReportFilters({ kind, filters, lookups, busy, onChange, onSubmit }: {
  kind: ReportKind; filters: Record<string, string>; lookups: Record<string, Row[]>; busy: boolean;
  onChange: (name: string, value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return <form className="report-filters panel" onSubmit={onSubmit}>
    {kind !== "fleet" && <>
      <label>Desde<input type="date" value={filters.from ?? ""} onChange={(event) => onChange("from", event.target.value)} /></label>
      <label>Hasta<input type="date" min={filters.from} value={filters.to ?? ""} onChange={(event) => onChange("to", event.target.value)} /></label>
    </>}
    {(keysByKind[kind] ?? []).map((key) => <label key={key}>{relations[key].label}
      <select value={filters[key] ?? ""} onChange={(event) => onChange(key, event.target.value)}>
        <option value="">Todos</option>
        {(lookups[key] ?? []).map((row) => <option key={String(row[relations[key].id])} value={String(row[relations[key].id])}>{optionLabel(row)}</option>)}
      </select>
    </label>)}
    <Button variant="primary" type="submit" disabled={busy}>{busy ? "Consultando…" : "Aplicar filtros"}</Button>
  </form>;
}
