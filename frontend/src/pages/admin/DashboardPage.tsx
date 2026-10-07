import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/AuthContext";

import {
  useDashboardData,
} from "../../hooks/dashboard/useDashboardData";

import {
  MetricGrid,
} from "../../components/dashboard/MetricGrid";

import {
  NetworkPanel,
} from "../../components/dashboard/NetworkPanel";

import {
  Notice,
  PageHeader,
} from "../../components/ui/PageHeader";

import "../../styles/pages/admin/dashboard.css";


export function AdminDashboardPage() {
  const {
    user,
  } = useAuth();

  const {
    overview,
    loading,
    error,
  } = useDashboardData();


  return (
    <section className="dashboard-page admin-dashboard">

      {/* Encabezado */}
      <PageHeader
        eyebrow="ADMINISTRACIÓN DEL SISTEMA"
        title={
          "Hola, " +
          (user?.name.split(" ")[0] ?? "")
        }
        description="Gestiona la red, las cuentas y la operación desde tu centro de control."
      />


      {/* Estado */}
      <Notice
        error={error}
      />


      {/* Indicadores */}
      <MetricGrid
        loading={loading}
        metrics={[
          {
            title: "Líneas",
            value: overview?.lines,
            note: "Red de transporte",
            emphasis: true,
          },
          {
            title: "Estaciones",
            value: overview?.stations,
            note: "Puntos de la red",
          },
          {
            title: "Unidades",
            value: overview?.buses,
            note: "Flota registrada",
          },
          {
            title: "Recorridos abiertos",
            value: overview?.openTrips,
            note: "Seguimiento en curso",
          },
        ]}
      />


      {/* Contenido principal */}
      <div className="admin-dashboard-grid">

        {/* Red operativa */}
        <NetworkPanel />


        {/* Control y trazabilidad */}
        <aside className="admin-dashboard-side">

          <article className="help-card admin-control-card">

            <span className="eyebrow-text">
              CONTROL Y TRAZABILIDAD
            </span>

            <h3>
              Revisa los cambios del sistema
            </h3>

            <p>
              Consulta responsables y fechas de
              los registros administrativos.
            </p>

            <Link
              className="button secondary"
              to="/admin/audit"
            >
              Abrir bitácora
            </Link>

          </article>

        </aside>

      </div>

    </section>
  );
}