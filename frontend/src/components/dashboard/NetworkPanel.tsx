import { LineVisualization } from "../LineVisualization";
export function NetworkPanel() {
  return <article className="panel">
    <div className="panel-heading"><div><span className="eyebrow-text">RED OPERATIVA</span>
      <h2>Líneas y conexiones</h2><p>Estaciones en orden y conexiones de la red.</p>
    </div></div>
    <LineVisualization />
  </article>;
}
