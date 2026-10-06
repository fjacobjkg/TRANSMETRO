import { reportKinds, type ReportKind } from "../../types/reports.types";
export function ReportTabs({ selected, onSelect }: { selected: ReportKind; onSelect: (kind: ReportKind) => void }) {
  return <div className="resource-tabs" role="tablist" aria-label="Reportes">
    {reportKinds.map((item) => <button type="button" role="tab" aria-selected={selected === item.id}
      className={selected === item.id ? "active" : ""} key={item.id} onClick={() => onSelect(item.id)}>
      {item.title}
    </button>)}
  </div>;
}
