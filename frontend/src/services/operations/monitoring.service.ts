import { apiRequest } from "../http.client";
import type { Trip } from "../../types/operations.types";

// Read-only use of the existing paginated endpoint. Operator services stay unchanged.
export async function getMonitoringTrips(signal?: AbortSignal): Promise<Trip[]> {
  const trips: Trip[] = [];
  let page = 1;
  while (!signal?.aborted) {
    const response = await apiRequest<{ items: Trip[]; total: number }>(
      `/api/operations/trips?page=${page}&pageSize=100`, { method: "GET", signal });
    trips.push(...response.items);
    if (trips.length >= response.total || response.items.length === 0) return trips;
    page += 1;
  }
  return trips;
}
