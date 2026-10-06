import { useEffect, useState } from "react";
import { getNetworkLines } from "../../services/dashboard/dashboard.service";
import type { NetworkLine } from "../../types/dashboard.types";

export function useNetworkLines() {
  const [lines, setLines] = useState<NetworkLine[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    void getNetworkLines(controller.signal).then(setLines).catch((cause) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo cargar la red.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  return { lines, error, loading };
}
