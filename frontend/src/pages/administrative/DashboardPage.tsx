import {
  Link,
} from "react-router-dom";

import {
  useAuth,
} from "../../hooks/AuthContext";

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

import "../../styles/pages/administrative/dashboard.css";


export function AdministrativeDashboardPage() {
  const {
    user,
  } = useAuth();

  const {
    overview,
    loading,
    error,
  } = useDashboardData();


  return (
    <section className="dashboard-page administrative-dashboard">

      {/* Encabezado */}
      <PageHeader
        eyebrow="CONSULTA ADMINISTRATIVA"
        title={
          "Hola, " +
          (user?.name.split(" ")[0] ?? "")
        }
        description="Consulta la cobertura de la red, el personal y los resultados de la operación."
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
            title: "Municipalidades",
            value: overview?.municipalities,
            note: "Cobertura territorial",
          },
          {
            title: "Estaciones",
            value: overview?.stations,
            note: "Infraestructura registrada",
          },
          {
            title: "Unidades",
            value: overview?.buses,
            note: "Flota registrada",
          },
          {
            title: "Visitas",
            value: overview?.visits,
            note: "Registros de operación",
          },
        ]}
      />


      {/* Contenido principal */}
      <div className="administrative-dashboard-grid">

        {/* Red operativa */}
        <NetworkPanel />


        {/* Consultas */}
        <aside className="administrative-dashboard-side">

          <article className="help-card administrative-report-card">

            <span className="eyebrow-text">
              CONSULTAS Y EXPORTACIÓN
            </span>

            <h3>
              Información para tu seguimiento
            </h3>

            <p>
              Filtra visitas, asignaciones y conteos
              por fecha. Exporta los resultados
              desde reportes.
            </p>

            <Link
              className="button secondary"
              to="/administrativo/reports"
            >
              Abrir consultas
            </Link>

          </article>

        </aside>

      </div>

    </section>
  );
}