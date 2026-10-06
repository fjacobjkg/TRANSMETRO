import { apiRequest } from "../http.client";
import type { Row } from "../../types/table.types";
import { relations } from "../../config/catalog/relations";
import type { ReportKind } from "../../types/reports.types";

const lookupKeys = ["lineId", "stationId", "busId"] as const;
export async function getReportLookups(signal: AbortSignal) {
  const entries = await Promise.all(lookupKeys.map(async (key) => {
    const response = await apiRequest<{ items: Row[] }>(relations[key].path, { signal });
    return [key, response.items] as const;
  }));
  return Object.fromEntries(entries) as Record<string, Row[]>;
}
export function getReport(kind: ReportKind, signal: AbortSignal) {
  return apiRequest<Row>("/api/reports/" + kind, { signal });
}
export function getFilteredReport(kind: ReportKind, filters: Record<string, string>) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => Boolean(value)));
  return apiRequest<Row>("/api/reports/" + kind + "?" + query);
}
