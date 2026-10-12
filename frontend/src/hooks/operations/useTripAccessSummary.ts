import { useEffect, useState } from "react";
import { getFinalizedTrips } from "../../services/operations/operations.service";
import type { Trip } from "../../types/operations.types";

export function useTripAccessSummary() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError("");
    void getFinalizedTrips().then(items => {
      if (cancelled) return;
      const finalized = items.filter(trip => trip.estado === "FINALIZADO");
      setTrips(finalized);
      setSelectedTrip(current => finalized.some(trip => String(trip.id_recorrido) === current)
        ? current : String(finalized[0]?.id_recorrido ?? ""));
    }).catch(cause => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : "No se pudieron cargar los recorridos finalizados.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [revision]);
  return { trips, selectedTrip, setSelectedTrip, loading, error,
    trip: trips.find(trip => String(trip.id_recorrido) === selectedTrip),
    refresh: () => setRevision(current => current + 1) };
}
