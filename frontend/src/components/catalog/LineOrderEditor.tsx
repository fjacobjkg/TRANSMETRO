import { Notice } from "../ui/PageHeader";
import { optionLabel } from "../../config/catalog/relations";
import { useLineOrderEditor } from "../../hooks/catalog/useLineOrderEditor";

export function LineOrderEditor({ onSaved }: { onSaved: () => void }) {
  const { stations, lines, lineId, stops, setStops, error, message, busy, selectLine, update, move, submit } = useLineOrderEditor(onSaved);
  return <form className="line-order-editor" onSubmit={submit}>
    <Notice error={error} message={message} />
    <label>Línea<select required value={lineId} onChange={(event) => selectLine(event.target.value)}>
      <option value="">Selecciona la línea que quieres configurar</option>
      {lines.map((row) => <option key={String(row.id_linea)} value={String(row.id_linea)}>{optionLabel(row)}</option>)}
    </select></label>
    <div className="editor-intro"><strong>Orden del recorrido</strong>
      <p>Selecciona las estaciones y usa las flechas para ordenarlas. Cada distancia conecta con la siguiente parada.</p>
    </div>
    {stops.map((stop, index) => <div className="stop-editor" key={index}>
      <span className="stop-number">{index + 1}</span>
      <label>Estación<select required value={stop.stationId} onChange={(event) => update(index, { stationId: event.target.value })}>
        <option value="">Seleccionar estación</option>
        {stations.map((row) => <option disabled={stops.some((other, i) => i !== index && other.stationId === String(row.id_estacion))}
          key={String(row.id_estacion)} value={String(row.id_estacion)}>{optionLabel(row)}</option>)}
      </select></label>
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
