import { apiRequest } from "../http.client";
import type { AccessCount, Line, MediaOption, Trip } from "../../types/operations.types";
const guatemalaDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guatemala" }).format(new Date());
export async function getOperationLines() {
  const response = await apiRequest<{ items: Line[] }>("/api/operations/lines");
  return response.items;
}
export async function getOperationsData() {
  const [lineResponse, tripResponse, openResponse] = await Promise.all([
    getOperationLines(),
    apiRequest<{ items: Trip[] }>("/api/operations/trips?page=1&pageSize=50"),
    apiRequest<{ items: Trip[] }>("/api/operations/trips?state=EN_CURSO&pageSize=100"),
  ]);
  const openIds = new Set(openResponse.items.map((trip) => String(trip.id_recorrido)));
  return { lines: lineResponse,
    trips: [...openResponse.items, ...tripResponse.items.filter((trip) => !openIds.has(String(trip.id_recorrido)))],
    openTrips: openResponse.items };
}
export async function getStationMedia(stationId: string) {
  const response = await apiRequest<{ items: MediaOption[] }>(`/api/access-media/stations/${stationId}/media`);
  return response.items.filter((item) => item.activo);
}
export async function getTodayAccessCounts(stationId: string) {
  const today = guatemalaDate();
  const response = await apiRequest<{ items: AccessCount[] }>(`/api/access-media/access-counts?stationId=${stationId}&from=${today}&to=${today}`);
  return response.items;
}
export const createTrip = (lineId: number, busId: number) =>
  apiRequest("/api/operations/trips", { method: "POST", body: { lineId, busId } });
export const createVisit = (tripId: string | number, stationId: number, occupancy: number, demand: number) =>
  apiRequest(`/api/operations/trips/${tripId}/visits`, { method: "POST", body: { stationId, occupancy, demand } });
export async function saveAccessCount({ selectedMedia, quantity, stationId, existing }: {
  selectedMedia: number; quantity: number; stationId: string; existing?: AccessCount;
}) {
  if (existing) {
    await apiRequest(`/api/access-media/access-counts/${existing.id_registro_acceso}`, { method: "PATCH", body: { quantity } });
  } else {
    await apiRequest("/api/access-media/access-counts", {
      method: "POST", body: { stationMediaId: selectedMedia, recordDate: guatemalaDate(), quantity },
    });
  }
  return getTodayAccessCounts(stationId);
}
export const closeTrip = (tripId: string | number) =>
  apiRequest(`/api/operations/trips/${tripId}/close`, { method: "POST", body: { state: "CANCELADO" } });
