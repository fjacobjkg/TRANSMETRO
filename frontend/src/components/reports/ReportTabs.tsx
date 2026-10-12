import { getReportTabs, type ReportTabKind } from "../../types/reports.types";
export function ReportTabs({ selected, onSelect, showNetwork = true, paymentSimulation = false }: {
  selected: ReportTabKind; onSelect: (kind: ReportTabKind) => void; showNetwork?: boolean; paymentSimulation?: boolean;
}) {
  return <div className="resource-tabs" role="tablist" aria-label="Reportes">
    {getReportTabs({ showNetwork, paymentSimulation }).map((item) => <button type="button" role="tab" aria-selected={selected === item.id}
      className={selected === item.id ? "active" : ""} key={item.id} onClick={() => onSelect(item.id)}>
      {item.title}
    </button>)}
  </div>;
}
