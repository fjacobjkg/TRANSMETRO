import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../AuthContext";
import { closeTrip, createTrip, createVisit, getOperationsData, getStationMedia, getTodayAccessCounts, saveAccessCount } from "../../services/operations/operations.service";
import type { AccessCount, Line, MediaOption, Trip } from "../../types/operations.types";
const getError = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export function useOperationsWorkspace() {
  const { user } = useAuth();
  const [lines, setLines] = useState<Line[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedLine, setSelectedLine] = useState("");
  const [selectedBus, setSelectedBus] = useState("");
  const [selectedTrip, setSelectedTrip] = useState("");
  const [occupancy, setOccupancy] = useState("");
  const [demand, setDemand] = useState("");
  const [stationId, setStationId] = useState(user?.stationIds[0]?.toString() ?? "");
  const [media, setMedia] = useState<MediaOption[]>([]);
  const [accessCounts, setAccessCounts] = useState<AccessCount[]>([]);
  const [selectedMedia, setSelectedMedia] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelTrip, setCancelTrip] = useState<Trip | null>(null);

  const load = useCallback(async () => {
    const data = await getOperationsData();
    setLines(data.lines); setTrips(data.trips);
    setSelectedLine((current) => current || data.lines[0]?.id_linea.toString() || "");
    setSelectedTrip((current) => data.openTrips.some((trip) => String(trip.id_recorrido) === current)
      ? current : data.openTrips[0]?.id_recorrido.toString() || "");
  }, []);
  useEffect(() => { void load().catch((cause) => setError(getError(cause, "No se pudo cargar la operación."))); }, [load]);

  const line = lines.find((item) => item.id_linea.toString() === selectedLine);
  useEffect(() => {
    const availableBus = line?.asignaciones_bus.find(({ bus }) =>
      !trips.some((trip) => trip.estado === "EN_CURSO" && trip.bus.id_bus === bus.id_bus));
    setSelectedBus(availableBus?.bus.id_bus.toString() ?? "");
  }, [line, trips]);

  const activeTrip = trips.find((trip) => trip.id_recorrido.toString() === selectedTrip && trip.estado === "EN_CURSO");
  const tripLine = lines.find((item) => item.codigo === activeTrip?.linea.codigo);
  const nextStation = tripLine?.estaciones.slice().sort((a, b) => a.orden - b.orden)[activeTrip?.visitas.length ?? 0];

  useEffect(() => {
    setSelectedMedia("");
    if (!stationId) { setMedia([]); return; }
    let cancelled = false;
    void getStationMedia(stationId).then((items) => { if (!cancelled) setMedia(items); })
      .catch(() => { if (!cancelled) setMedia([]); });
    return () => { cancelled = true; };
  }, [stationId]);

  const loadAccessCounts = useCallback(async () => {
    if (!stationId) { setAccessCounts([]); return; }
    setAccessCounts(await getTodayAccessCounts(stationId));
  }, [stationId]);
  useEffect(() => { void loadAccessCounts().catch(() => setAccessCounts([])); }, [loadAccessCounts]);

  const perform = useCallback(async (action: () => Promise<unknown>, success: string) => {
    setBusy(true); setError(""); setMessage("");
    try { await action(); await load(); setMessage(success); return true; }
    catch (cause) { setError(getError(cause, "No fue posible guardar los datos.")); return false; }
    finally { setBusy(false); }
  }, [load]);

  function startTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLine || !selectedBus) return;
    void perform(() => createTrip(Number(selectedLine), Number(selectedBus)), "Recorrido iniciado.");
  }
  function recordVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTrip || !nextStation) return;
    void perform(() => createVisit(activeTrip.id_recorrido, nextStation.estacion_id, Number(occupancy), Number(demand)),
      "Visita registrada y evaluada.").then((saved) => {
        if (saved) { setOccupancy(""); setDemand(""); }
      });
  }
  function recordCount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMedia || !user) return;
    const existing = accessCounts.find((entry) =>
      entry.estacion_medio_acceso_id === Number(selectedMedia) && entry.usuario_id === user.id);
    void perform(async () => {
      setAccessCounts(await saveAccessCount({ selectedMedia: Number(selectedMedia), quantity: Number(quantity), stationId, existing }));
    }, existing ? "Conteo corregido; el cambio quedó registrado en la bitácora." : "Conteo guardado en la bitácora.")
      .then((saved) => { if (saved) setQuantity(""); });
  }
  function cancelSelectedTrip() {
    if (!cancelTrip) return;
    void perform(() => closeTrip(cancelTrip.id_recorrido), "Recorrido cancelado.")
      .then((saved) => { if (saved) setCancelTrip(null); });
  }

  const stationOptions = useMemo(() => user?.role === "OPERADOR_ESTACION" ? user.stationIds : [], [user]);
  const stationNames = useMemo(() => new Map(lines.flatMap((item) =>
    item.estaciones.map((entry) => [entry.estacion_id, entry.estacion.nombre] as const))), [lines]);
  const canRecordNext = Boolean(nextStation &&
    (user?.role === "ADMIN" || user?.stationIds.includes(nextStation.estacion_id)));

  return {
    user, lines, trips, line, activeTrip, nextStation, stationOptions, stationNames, media, accessCounts,
    selectedLine, setSelectedLine, selectedBus, setSelectedBus, selectedTrip, setSelectedTrip,
    stationId, setStationId, selectedMedia, setSelectedMedia, occupancy, setOccupancy, demand, setDemand,
    quantity, setQuantity, message, error, busy, cancelTrip, setCancelTrip, canRecordNext,
    startTrip, recordVisit, recordCount, cancelSelectedTrip,
    refresh: () => void load().catch((cause) => setError(getError(cause, "No se pudo actualizar la operación."))),
  };
}
