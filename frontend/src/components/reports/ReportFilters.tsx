import type { FormEvent } from "react";
import { Button } from "../ui/Button";
import { SearchableSelect } from "../ui/SearchableSelect";
import { relations, optionLabel } from "../../config/catalog/relations";
import type { Row } from "../ui/DataTable";
import type { ReportTabKind } from "../../types/reports.types";

const keysByKind: Partial<Record<ReportTabKind, string[]>> = {
  operations: ["lineId", "stationId", "busId"],
  fleet: ["lineId", "busId"],
  "access-counts": ["stationId"],
  "payment-simulation": ["lineId", "busId"],
};
export function ReportFilters({ kind, filters, lookups, busy, onChange, onSubmit }: {
  kind: ReportTabKind; filters: Record<string, string>; lookups: Record<string, Row[]>; busy: boolean;
  onChange: (name: string, value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return <form className="report-filters panel" onSubmit={onSubmit}>
    {kind !== "fleet" && <>
      <label>Desde<input type="date" value={filters.from ?? ""} onChange={(event) => onChange("from", event.target.value)} /></label>
      <label>Hasta<input type="date" min={filters.from} value={filters.to ?? ""} onChange={(event) => onChange("to", event.target.value)} /></label>
    </>}
    {(keysByKind[kind] ?? []).map((key) => <label key={key}>{relations[key].label}
      <SearchableSelect value={filters[key] ?? ""} onChange={value => onChange(key, value)} placeholder="Todos"
        options={(lookups[key] ?? []).map(row => ({ value: String(row[relations[key].id]), label: optionLabel(row) }))} />
    </label>)}
    <Button variant="primary" type="submit" disabled={busy}>{busy ? "Consultando…" : "Aplicar filtros"}</Button>
  </form>;
}
