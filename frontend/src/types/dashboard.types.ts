export type Overview = {
  municipalities: number; lines: number; stations: number; buses: number; openTrips: number; visits: number;
} | null;
export type NetworkLine = {
  id: number; code: string; name: string; municipality: string; totalDistance: number | null;
  stations: Array<{
    id: number; code: string; name: string; order: number; distanceToNext: number | null; sharedLineIds: number[];
  }>;
};
