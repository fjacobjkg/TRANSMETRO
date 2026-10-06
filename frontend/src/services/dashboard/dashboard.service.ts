import { apiRequest } from "../http.client";
import type { NetworkLine, Overview } from "../../types/dashboard.types";
export function getDashboardOverview(signal?: AbortSignal) {
  return apiRequest<Overview>("/api/reports/overview", { signal });
}
export async function getNetworkLines(signal: AbortSignal) {
  const result = await apiRequest<{ items: NetworkLine[] }>("/api/reports/lines", { signal });
  return result.items;
}
