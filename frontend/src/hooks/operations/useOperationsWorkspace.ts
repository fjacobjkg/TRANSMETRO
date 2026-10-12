import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../AuthContext";
import { closeTrip, createTrip, createVisit, getOperationsData } from "../../services/operations/operations.service";
import type { Line, Trip } from "../../types/operations.types";
const getError = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export function useOperationsWorkspace() {
  const { user } = useAuth();
  const [lines, setLines] = useState<Line[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedLine, setSelectedLine] = useState("");
  const [selectedBus, setSelectedBus] = useState("");
  const [selectedTrip, setSelectedTrip] = useState("");
  const [peopleOff, setPeopleOff] = useState("");
  const [peopleBoarding, setPeopleBoarding] = useState("");
  const [demand, setDemand] = useState("");
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

  useEffect(() => { setPeopleOff(""); setPeopleBoarding(""); setDemand(""); }, [selectedTrip, nextStation?.estacion_id]);

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
    if (busy || !activeTrip || !nextStation || !canRecordNext || !peopleOff.trim() || !peopleBoarding.trim() || !demand.trim()) return;
    void perform(() => createVisit(activeTrip.id_recorrido, nextStation.estacion_id, Number(demand), Number(peopleOff), Number(peopleBoarding)),
      "Visita registrada y evaluada.").then((saved) => {
        if (saved) { setPeopleOff(""); setPeopleBoarding(""); setDemand(""); }
      });
  }
  function cancelSelectedTrip() {
    if (!cancelTrip) return;
    void perform(() => closeTrip(cancelTrip.id_recorrido), "Recorrido cancelado.")
      .then((saved) => { if (saved) setCancelTrip(null); });
  }

  const canRecordNext = Boolean(nextStation &&
    (user?.role === "ADMIN" || user?.stationIds.includes(nextStation.estacion_id)));

  return {
    user, lines, trips, line, activeTrip, nextStation,
    selectedLine, setSelectedLine, selectedBus, setSelectedBus, selectedTrip, setSelectedTrip,
    peopleOff, setPeopleOff, peopleBoarding, setPeopleBoarding, demand, setDemand,
    message, error, busy, cancelTrip, setCancelTrip, canRecordNext,
    startTrip, recordVisit, cancelSelectedTrip,
    refresh: () => void load().catch((cause) => setError(getError(cause, "No se pudo actualizar la operación."))),
  };
}
