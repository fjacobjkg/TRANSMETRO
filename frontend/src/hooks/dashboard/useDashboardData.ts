import { useEffect, useState } from "react";
import { getDashboardOverview } from "../../services/dashboard/dashboard.service";
import type { Overview } from "../../types/dashboard.types";

export function useDashboardData() {
  const [overview, setOverview] = useState<Overview>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void getDashboardOverview(controller.signal).then(setOverview)
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo cargar el resumen."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  return { overview, loading, error };
}
