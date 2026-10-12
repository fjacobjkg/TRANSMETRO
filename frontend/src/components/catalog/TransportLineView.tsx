import { useEffect, useState } from "react";
import { getCatalogRows } from "../../services/catalog/catalog.service";
import { transportNetworkLines, type CatalogLine } from "../../utils/transport-line-view";
import type { NetworkLine } from "../../types/dashboard.types";
import { LineDiagram } from "../LineVisualization";

export function TransportLineView() {
  const [lines, setLines] = useState<NetworkLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void getCatalogRows("/api/transport/lines", controller.signal).then(result => {
      if (!controller.signal.aborted) setLines(transportNetworkLines((result.items ?? []) as CatalogLine[]));
    }).catch(cause => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo cargar la vista de líneas.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  return <article className="panel">
    <div className="panel-heading"><div><h2>Vista de líneas</h2><p>Consulta el orden de estaciones y las distancias de las líneas configuradas.</p></div></div>
    <LineDiagram lines={lines} loading={loading} error={error} emptyText="No hay líneas configuradas para mostrar."
      note="Esquema del orden de estaciones. No representa ubicación geográfica." />
  </article>;
}
