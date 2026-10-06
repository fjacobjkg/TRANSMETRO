import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/AuthContext";
import { useDashboardData } from "../../hooks/dashboard/useDashboardData";
import { MetricGrid } from "../../components/dashboard/MetricGrid";
import { NetworkPanel } from "../../components/dashboard/NetworkPanel";
import { QuickActions } from "../../components/dashboard/QuickActions";
import { Notice, PageHeader } from "../../components/ui/PageHeader";
import "../../styles/pages/admin.css";

export function AdminDashboardPage() {
  const { user } = useAuth();
  const { overview, loading, error } = useDashboardData();
  return <section className="dashboard-page admin-dashboard">
    <PageHeader eyebrow="ADMINISTRACIÓN DEL SISTEMA" title={"Hola, " + (user?.name.split(" ")[0] ?? "")}
      description="Gestiona la red, las cuentas y la operación desde tu centro de control."
      actions={<Link className="button primary" to="/admin/users">Gestionar cuentas →</Link>} />
    <Notice error={error} />
    <MetricGrid loading={loading} metrics={[
      { title: "Líneas", value: overview?.lines, note: "Red de transporte" },
      { title: "Estaciones", value: overview?.stations, note: "Puntos de la red" },
      { title: "Unidades", value: overview?.buses, note: "Flota registrada" },
      { title: "Recorridos abiertos", value: overview?.openTrips, note: "Seguimiento en curso" },
    ]} />
    <div className="dashboard-grid"><NetworkPanel /><aside className="dashboard-side">
      <QuickActions role="ADMIN" />
      <article className="help-card admin-control-card"><span className="eyebrow-text">CONTROL Y TRAZABILIDAD</span>
        <h3>Revisa los cambios del sistema</h3><p>Consulta responsables y fechas de los registros administrativos.</p>
        <Link className="button secondary" to="/admin/audit">Abrir bitácora</Link>
      </article>
    </aside></div>
  </section>;
}
