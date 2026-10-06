import { useNetworkLines } from "../hooks/dashboard/useNetworkLines";

export function LineVisualization() {
  const { lines, error, loading } = useNetworkLines();
  return <div className="network-lines">
    {loading && <p className="muted" role="status">Cargando red de transporte…</p>}
    {error && <p role="alert">{error}</p>}
    {!lines.length && !error && !loading && <p className="muted">No hay líneas operativas para mostrar.</p>}
    {lines.map((line, index) => <article className={"network-line line-color-" + (index % 3)} key={line.id}>
      <div className="network-heading"><span className="line-code">{line.code}</span>
        <div><h3>{line.name}</h3><p>{line.municipality} · {line.stations.length} estaciones</p></div>
        <strong>{line.totalDistance === null ? "Distancias pendientes" : line.totalDistance.toFixed(2) + " km"}</strong>
      </div>
      <ol className="network-stops">{line.stations.map((stop) => <li key={stop.id}>
        <span className="network-dot" aria-hidden="true" /><strong>{stop.name}</strong><span>{stop.code}</span>
        {stop.sharedLineIds.length > 0 && <small className="connection-tag">
          Conecta con {stop.sharedLineIds.map((id) => lines.find((other) => other.id === id)?.code ?? "línea " + id).join(", ")}
        </small>}
        {stop.distanceToNext !== null && <small className="segment-distance">{stop.distanceToNext} km →</small>}
      </li>)}</ol>
    </article>)}
    <p className="muted">Esquema del orden de estaciones. Las conexiones indican estaciones compartidas; no representa ubicación geográfica.</p>
  </div>;
}
