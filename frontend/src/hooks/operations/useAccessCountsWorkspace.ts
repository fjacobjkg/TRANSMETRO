import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../AuthContext";
import { getOperationLines, getStationMedia, getTodayAccessCounts, saveAccessCount } from "../../services/operations/operations.service";
import type { AccessCount, Line, MediaOption } from "../../types/operations.types";

export function useAccessCountsWorkspace() {
  const { user } = useAuth();
  const [lines, setLines] = useState<Line[]>([]);
  const [stationId, setStationId] = useState(user?.stationIds[0]?.toString() ?? "");
  const [media, setMedia] = useState<MediaOption[]>([]);
  const [selectedMedia, setSelectedMedia] = useState("");
  const [accessCounts, setAccessCounts] = useState<AccessCount[]>([]);
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getOperationLines().then((items) => { if (!cancelled) setLines(items); })
      .catch(() => { if (!cancelled) setError("No se pudieron cargar los nombres de las estaciones."); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setSelectedMedia(""); setQuantity(""); setMedia([]); setAccessCounts([]); setMessage("");
    if (!stationId) { setLoading(false); return; }
    setLoading(true);
    void Promise.all([getStationMedia(stationId), getTodayAccessCounts(stationId)])
      .then(([items, counts]) => {
        if (!cancelled) { setMedia(items); setAccessCounts(counts); }
      })
      .catch(() => { if (!cancelled) setError("No se pudieron cargar los medios y conteos de la estación."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [stationId]);

  const stationOptions = user?.role === "OPERADOR_ESTACION" ? user.stationIds : [];
  const stationNames = useMemo(() => new Map(lines.flatMap((line) =>
    line.estaciones.map((entry) => [entry.estacion_id, entry.estacion.nombre] as const))), [lines]);

  function recordCount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || saving || !selectedMedia || !user || !stationOptions.includes(Number(stationId))) return;
    const existing = accessCounts.find((entry) =>
      entry.estacion_medio_acceso_id === Number(selectedMedia) && entry.usuario_id === user.id);
    setSaving(true); setError(""); setMessage("");
    void saveAccessCount({ selectedMedia: Number(selectedMedia), quantity: Number(quantity), stationId, existing })
      .then((counts) => {
        setAccessCounts(counts); setQuantity("");
        setMessage(existing ? "Conteo corregido; el cambio quedó registrado en la bitácora." : "Conteo guardado en la bitácora.");
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "No fue posible guardar el conteo."))
      .finally(() => setSaving(false));
  }

  return {
    user, stationOptions, stationNames, stationId, media, selectedMedia, accessCounts, quantity,
    message, error, busy: loading || saving, recordCount,
    setStationId: (value: string) => { if (!saving) setStationId(value); },
    setSelectedMedia: (value: string) => { if (!saving) setSelectedMedia(value); },
    setQuantity: (value: string) => { if (!saving) setQuantity(value); },
  };
}
