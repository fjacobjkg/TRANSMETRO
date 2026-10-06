import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/AuthContext";
import { useDashboardData } from "../../hooks/dashboard/useDashboardData";
import { MetricGrid } from "../../components/dashboard/MetricGrid";
import { NetworkPanel } from "../../components/dashboard/NetworkPanel";
import { QuickActions } from "../../components/dashboard/QuickActions";
import { Notice, PageHeader } from "../../components/ui/PageHeader";
import "../../styles/pages/administrative.css";

export function AdministrativeDashboardPage() {
  const { user } = useAuth();
  const { overview, loading, error } = useDashboardData();
  return <section className="dashboard-page administrative-dashboard">
    <PageHeader eyebrow="CONSULTA ADMINISTRATIVA" title={"Hola, " + (user?.name.split(" ")[0] ?? "")}
      description="Consulta la cobertura de la red, el personal y los resultados de la operación."
      actions={<Link className="button primary" to="/administrativo/reports">Consultar reportes →</Link>} />
    <Notice error={error} />
    <MetricGrid loading={loading} metrics={[
      { title: "Municipalidades", value: overview?.municipalities, note: "Cobertura territorial" },
      { title: "Estaciones", value: overview?.stations, note: "Infraestructura registrada" },
      { title: "Unidades", value: overview?.buses, note: "Flota registrada" },
      { title: "Visitas", value: overview?.visits, note: "Registros de operación" },
    ]} />
    <div className="dashboard-grid"><NetworkPanel /><aside className="dashboard-side">
      <QuickActions role="ADMINISTRATIVO" />
      <article className="help-card administrative-report-card"><span className="eyebrow-text">CONSULTAS Y EXPORTACIÓN</span>
        <h3>Información para tu seguimiento</h3><p>Filtra visitas, asignaciones y conteos por fecha. Exporta los resultados desde reportes.</p>
        <Link className="button secondary" to="/administrativo/reports">Abrir consultas</Link>
      </article>
    </aside></div>
  </section>;
}
