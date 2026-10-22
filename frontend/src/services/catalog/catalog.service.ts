import { apiRequest } from "../http.client";
import { relations } from "../../config/catalog/relations";
import type { Resource } from "../../types/catalog.types";
import type { Row } from "../../types/table.types";

export async function getCatalogRows(path: string, signal?: AbortSignal) {
  return apiRequest<{ items?: Row[]; total?: number }>(path, { signal });
}

export async function getCatalogLookups(resource: Resource, signal: AbortSignal) {
  const fields = (resource.fields ?? []).filter((field) => relations[field.name]);
  const entries = await Promise.all(fields.map(async (field) => {
    const relation = relations[field.name];
    const path = field.name === "userId" && resource.key === "update-user"
      ? "/api/users?pageSize=100" : relation.path;
    const response = await apiRequest<{ items: Row[] }>(path, { signal });
    return [field.name, response.items] as const;
  }));
  return Object.fromEntries(entries) as Record<string, Row[]>;
}

export function saveCatalogEntry(path: string, method: string | undefined, body: unknown) {
  return apiRequest(path, { method, body });
}

export function endAccessGuardAssignment(assignmentId: number) {
  return apiRequest("/api/security/guard-assignments/" + assignmentId, { method: "DELETE" });
}

export async function getLineEditorData() {
  const [lines, stations] = await Promise.all([
    apiRequest<{ items: Row[] }>("/api/transport/lines"),
    apiRequest<{ items: Row[] }>("/api/transport/stations"),
  ]);
  return { lines: lines.items, stations: stations.items };
}

export function saveLineStations(lineId: string, stations: Array<{
  stationId: number; order: number; distanceToNext: number | null;
}>) {
  return apiRequest("/api/transport/lines/" + lineId + "/stations", {
    method: "PUT",
    body: { stations },
  });
}
