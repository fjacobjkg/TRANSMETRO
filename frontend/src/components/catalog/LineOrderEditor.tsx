import { Notice } from "../ui/PageHeader";
import { useEffect } from "react";
import { optionLabel } from "../../config/catalog/relations";
import { useLineOrderEditor } from "../../hooks/catalog/useLineOrderEditor";
import { SearchableSelect } from "../ui/SearchableSelect";

export function LineOrderEditor({ onSaved, initialLineId, onBusyChange }: {
  onSaved: () => void; initialLineId?: string; onBusyChange?: (busy: boolean) => void;
}) {
  const { stations, lines, lineId, stops, setStops, error, message, busy, selectLine, update, move, submit } = useLineOrderEditor(onSaved, initialLineId);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  return <form className="line-order-editor" onSubmit={submit}>
    <Notice error={error} message={message} />
    <label>Línea<SearchableSelect required disabled={Boolean(initialLineId)} value={lineId} onChange={selectLine}
      placeholder="Selecciona la línea que quieres configurar"
      options={lines.map(row => ({ value: String(row.id_linea), label: optionLabel(row) }))} /></label>
    <div className="editor-intro"><strong>Orden del recorrido</strong>
      <p>Selecciona las estaciones y usa las flechas para ordenarlas. Cada distancia conecta con la siguiente parada.</p>
    </div>
    {stops.map((stop, index) => <div className="stop-editor" key={index}>
      <span className="stop-number">{index + 1}</span>
      <label>Estación<SearchableSelect required value={stop.stationId} onChange={stationId => update(index, { stationId })}
        placeholder="Seleccionar estación" options={stations.map(row => ({ value: String(row.id_estacion), label: optionLabel(row),
          disabled: stops.some((other, i) => i !== index && other.stationId === String(row.id_estacion)) }))} /></label>
      {index < stops.length - 1
        ? <label>Distancia a la siguiente (km)<input type="number" min="0" step="0.001" required value={stop.distance}
            onChange={(event) => update(index, { distance: event.target.value })} /></label>
        : <span className="muted">Última parada</span>}
      <div className="row-actions">
        <button className="button quiet" type="button" aria-label={"Subir parada " + (index + 1)} disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
        <button className="button quiet" type="button" aria-label={"Bajar parada " + (index + 1)} disabled={index === stops.length - 1} onClick={() => move(index, 1)}>↓</button>
        <button className="button danger" type="button" aria-label={"Quitar parada " + (index + 1)} onClick={() => setStops(stops.filter((_, i) => i !== index))}>✕</button>
      </div>
    </div>)}
    <div className="form-footer"><span className="muted">{stops.length} estaciones · {stops.slice(0, -1).reduce((sum, stop) => sum + Number(stop.distance || 0), 0).toFixed(3)} km</span>
      <button type="button" className="button secondary" disabled={!lineId}
        onClick={() => setStops([...stops, { stationId: "", distance: "" }])}>＋ Añadir parada</button>
      <button className="button primary" disabled={busy || !lineId || stops.length < 1}>{busy ? "Guardando…" : "Guardar recorrido"}</button>
    </div>
  </form>;
}
