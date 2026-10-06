import { useEffect, useState } from "react";
import { fetchApiHealth, type ApiHealth } from "../../services/health.service";

export function useServiceHealth() {
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [healthError, setHealthError] = useState(false);
  useEffect(() => {
    let active = true;
    void fetchApiHealth().then((value) => { if (active) { setHealth(value); setHealthError(value.status !== "ok"); } })
      .catch(() => { if (active) setHealthError(true); });
    return () => { active = false; };
  }, []);
  return { serviceAvailable: health?.status === "ok", healthError };
}
