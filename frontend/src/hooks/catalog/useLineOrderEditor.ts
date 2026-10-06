import { useEffect, useState, type FormEvent } from "react";
import type { Row } from "../../types/table.types";
import { getLineEditorData, saveLineStations } from "../../services/catalog/catalog.service";

type Stop = { stationId: string; distance: string };
export function useLineOrderEditor(onSaved: () => void) {
  const [lines, setLines] = useState<Row[]>([]);
  const [stations, setStations] = useState<Row[]>([]);
  const [lineId, setLineId] = useState("");
  const [stops, setStops] = useState<Stop[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    void getLineEditorData().then((data) => {
      if (live) { setLines(data.lines); setStations(data.stations); }
    }).catch((cause) => {
      if (live) setError(cause instanceof Error ? cause.message : "No se pudieron cargar las estaciones.");
    });
    return () => { live = false; };
  }, []);

  function selectLine(id: string) {
    setLineId(id);
    setMessage("");
    const line = lines.find((row) => String(row.id_linea) === id);
    setStops(((line?.estaciones ?? []) as Row[]).map((row) => ({
      stationId: String(row.estacion_id),
      distance: row.distancia_siguiente == null ? "" : String(row.distancia_siguiente),
    })));
  }
  function update(index: number, patch: Partial<Stop>) {
    setStops((current) => current.map((stop, itemIndex) => itemIndex === index ? { ...stop, ...patch } : stop));
  }
  function move(index: number, delta: number) {
    setStops((current) => {
      const result = [...current];
      [result[index], result[index + delta]] = [result[index + delta], result[index]];
      return result;
    });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      if (stops.length < 1) throw new Error("Configura al menos una estación.");
      if (new Set(stops.map((stop) => stop.stationId)).size !== stops.length) {
        throw new Error("Una estación no puede repetirse dentro de la misma línea.");
      }
      await saveLineStations(lineId, stops.map((stop, index) => ({
        stationId: Number(stop.stationId), order: index + 1,
        distanceToNext: index === stops.length - 1 ? null : Number(stop.distance),
      })));
      setMessage("Orden y distancias guardados.");
      onSaved();
      setLines((await getLineEditorData()).lines);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar.");
    } finally { setBusy(false); }
  }

  return { lines, stations, lineId, stops, setStops, error, message, busy, selectLine, update, move, submit };
}
