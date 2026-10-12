import { useMemo, useState } from "react";
import { CatalogResourceTabs } from "../../components/catalog/CatalogResourceTabs";
import { MetricGrid } from "../../components/dashboard/MetricGrid";
import { OperationalMonitoringTable } from "../../components/operations/OperationalMonitoringTable";
import { Notice, PageHeader } from "../../components/ui/PageHeader";
import { useOperationalMonitoring } from "../../hooks/operations/useOperationalMonitoring";
import { monitoringSummary, monitoringTrips } from "../../utils/operational-monitoring";
import "../../styles/pages/operations.css";
import "../../styles/pages/admin/operations.css";

const sections = [{ key: "active", title: "En curso" }, { key: "history", title: "Historial" }];

export function AdminOperationsPage() {
  const workspace = useOperationalMonitoring();
  const [selectedSection, setSelectedSection] = useState("active");
  const trips = useMemo(() => monitoringTrips(workspace.trips, selectedSection), [workspace.trips, selectedSection]);
  const summary = useMemo(() => monitoringSummary(workspace.trips), [workspace.trips]);
  return <section className="admin-page admin-operations-page feature-page operations-page">
    <PageHeader eyebrow="INFORMACIÓN OPERATIVA" title="Seguimiento operativo"
      description="Consulta los recorridos registrados y revisa el estado de la operación."
      />
    <CatalogResourceTabs resources={sections} selected={selectedSection} onSelect={setSelectedSection}
      label="Secciones de seguimiento operativo" panelId="admin-monitoring-panel" idPrefix="admin-monitoring-tab" />
    <Notice error={workspace.error} />
    <MetricGrid loading={workspace.loading} metrics={[
      { title: "Recorridos en curso", value: workspace.error ? undefined : summary.active, note: "Operaciones activas" },
      { title: "Recorridos finalizados", value: workspace.error ? undefined : summary.finalized, note: "Recorridos completados" },
      { title: "Visitas registradas", value: workspace.error ? undefined : summary.visits, note: "Visitas de los recorridos cargados" },
      { title: "Visitas con alertas", value: workspace.error ? undefined : summary.alerts, note: "Apoyo de unidad o espera adicional" },
    ]} />
    <div id="admin-monitoring-panel" role="tabpanel" aria-labelledby={`admin-monitoring-tab-${selectedSection}`}>
      <OperationalMonitoringTable key={selectedSection} trips={trips} lines={workspace.lines}
        loading={workspace.loading} active={selectedSection === "active"} />
    </div>
  </section>;
}
