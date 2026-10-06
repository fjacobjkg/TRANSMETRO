import {
  useAuth,
} from "../../hooks/AuthContext";

import {
  MetricGrid,
} from "../../components/dashboard/MetricGrid";

import {
  PageHeader,
} from "../../components/ui/PageHeader";

import "../../styles/pages/operator.css";


export function OperatorDashboardPage() {
  const {
    user,
  } = useAuth();


  return (
    <section className="dashboard-page operator-dashboard">

      {/* Encabezado */}
      <PageHeader
        eyebrow="OPERACIÓN DE ESTACIÓN"
        title={
          "Hola, " +
          (user?.name.split(" ")[0] ?? "")
        }
        description="Registra visitas y conteos de acceso en las estaciones que tienes asignadas."
      />


      {/* Indicadores */}
      <MetricGrid
        metrics={[
          {
            title:
              "Estaciones asignadas",
            value:
              user?.stationIds.length,
            note:
              "Tu ámbito de operación",
          },
          {
            title:
              "Demanda alta",
            value:
              "≥ 150 %",
            note:
              "Regla de unidad adicional",
          },
          {
            title:
              "Ocupación baja",
            value:
              "< 25 %",
            note:
              "Regla de espera adicional",
          },
        ]}
      />


      {/* Información principal */}
      <div className="operator-dashboard-grid">

        {/* Flujo */}
        <article className="panel operator-workflow">

          <span className="eyebrow-text">
            TU JORNADA
          </span>

          <h2>
            Flujo de trabajo
          </h2>

          <ol className="workflow-list">

            <li>
              <span>
                01
              </span>

              <div>
                <strong>
                  Inicia el recorrido
                </strong>

                <p>
                  Selecciona la línea y una
                  unidad disponible.
                </p>
              </div>
            </li>


            <li>
              <span>
                02
              </span>

              <div>
                <strong>
                  Registra la siguiente estación
                </strong>

                <p>
                  Captura ocupación y demanda
                  de cada visita.
                </p>
              </div>
            </li>


            <li>
              <span>
                03
              </span>

              <div>
                <strong>
                  Actualiza los conteos del día
                </strong>

                <p>
                  Registra los accesos por medio
                  en tus estaciones.
                </p>
              </div>
            </li>

          </ol>

        </article>


        {/* Estaciones asignadas */}
        <aside className="operator-dashboard-side">

          <article className="assigned-stations-card">

            <span className="eyebrow-text">
              ESTACIONES ASIGNADAS
            </span>

            <h3>
              Tu área de trabajo
            </h3>

            <p>
              {user?.stationIds.length
                ? `Identificadores: ${user.stationIds.join(", ")}`
                : "No tienes estaciones asignadas. Solicita la asignación al administrador."}
            </p>

          </article>

        </aside>

      </div>

    </section>
  );
}