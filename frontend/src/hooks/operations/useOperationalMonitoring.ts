import { useEffect, useState } from "react";
import { getOperationLines } from "../../services/operations/operations.service";
import { getMonitoringTrips } from "../../services/operations/monitoring.service";
import type { Line, Trip } from "../../types/operations.types";

export function useOperationalMonitoring() {
  const [lines, setLines] = useState<Line[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    void Promise.all([getOperationLines(), getMonitoringTrips(controller.signal)])
      .then(([loadedLines, loadedTrips]) => {
        if (!controller.signal.aborted) { setLines(loadedLines); setTrips(loadedTrips); }
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo cargar el seguimiento operativo.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  return { lines, trips, loading, error, refresh: () => setRevision(current => current + 1) };
}
