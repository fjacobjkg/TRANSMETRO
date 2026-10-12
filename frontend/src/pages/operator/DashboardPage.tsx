import {
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "../../hooks/AuthContext";

import {
  MetricGrid,
} from "../../components/dashboard/MetricGrid";

import {
  PageHeader,
} from "../../components/ui/PageHeader";

import {
  getOperationsData,
} from "../../services/operations/operations.service";

import "../../styles/pages/operator/dashboard.css";


export function OperatorDashboardPage() {
  const {
    user,
  } = useAuth();


  const [
    stationNames,
    setStationNames,
  ] = useState<string[]>([]);

  const [
    activeTrips,
    setActiveTrips,
  ] = useState(0);

  const [
    availableBuses,
    setAvailableBuses,
  ] = useState(0);


  const stationCount =
    user?.stationIds?.length ?? 0;


  /* ========================================
     INFORMACIÓN OPERATIVA
  ======================================== */

  useEffect(() => {
    if (
      !user ||
      user.role !== "OPERADOR_ESTACION"
    ) {
      setStationNames([]);
      setActiveTrips(0);
      setAvailableBuses(0);
      return;
    }


    const assignedStationIds =
      user.stationIds ?? [];

    let cancelled = false;


    async function loadDashboard() {
      try {
        const data =
          await getOperationsData();


        /* ====================================
           ESTACIONES ASIGNADAS
        ==================================== */

        const names =
          Array.from(
            new Set(
              data.lines.flatMap((line) =>
                line.estaciones
                  .filter((entry) =>
                    assignedStationIds.includes(
                      entry.estacion_id,
                    ),
                  )
                  .map(
                    (entry) =>
                      entry.estacion.nombre,
                  ),
              ),
            ),
          );


        /* ====================================
           RECORRIDOS ACTIVOS
        ==================================== */

        const openTrips =
          data.openTrips;


        /* ====================================
           BUSES OCUPADOS
        ==================================== */

        const busyBusIds =
          new Set(
            openTrips.map(
              (trip) =>
                trip.bus.id_bus,
            ),
          );


        /* ====================================
           BUSES DISPONIBLES
        ==================================== */

        const availableBusIds =
          new Set<number>();


        data.lines.forEach((line) => {
          line.asignaciones_bus.forEach(
            ({ bus }) => {
              if (
                !busyBusIds.has(
                  bus.id_bus,
                )
              ) {
                availableBusIds.add(
                  bus.id_bus,
                );
              }
            },
          );
        });


        if (!cancelled) {
          setStationNames(names);

          setActiveTrips(
            openTrips.length,
          );

          setAvailableBuses(
            availableBusIds.size,
          );
        }

      } catch {
        if (!cancelled) {
          setStationNames([]);
          setActiveTrips(0);
          setAvailableBuses(0);
        }
      }
    }


    void loadDashboard();


    return () => {
      cancelled = true;
    };

  }, [user]);


  /* ========================================
     RENDER
  ======================================== */

  return (
    <section className="dashboard-page operator-dashboard">

      {/* ENCABEZADO */}

      <PageHeader
        eyebrow="OPERACIÓN DE ESTACIÓN"
        title={
          "Hola, " +
          (user?.name.split(" ")[0] ?? "")
        }
        description="Inicia recorridos y registra las visitas de las estaciones que tienes asignadas."
      />


      {/* INDICADORES */}

      <MetricGrid
        metrics={[
          {
            title:
              "Estaciones asignadas",

            value:
              stationCount,

            note:
              "Tu área de trabajo",

            emphasis:
              true,
          },

          {
            title:
              "Recorridos activos",

            value:
              activeTrips,

            note:
              activeTrips > 0
                ? "Recorridos actualmente en seguimiento"
                : "No hay recorridos en curso",
          },

          {
            title:
              "Buses disponibles",

            value:
              availableBuses,

            note:
              availableBuses > 0
                ? "Listos para iniciar otro recorrido"
                : "No hay unidades libres actualmente",
          },
        ]}
      />


      {/* INFORMACIÓN PRINCIPAL */}

      <div className="operator-dashboard-grid">

        {/* FLUJO DE TRABAJO */}

        <article className="panel operator-workflow">

          <span className="eyebrow-text">
            TU JORNADA
          </span>

          <h2>
            Flujo de trabajo
          </h2>


          <ol className="operator-workflow-list">

            {/* PASO 1 */}

            <li>

              <span>
                01
              </span>

              <div>

                <strong>
                  Inicia un recorrido
                </strong>

                <p>
                  Selecciona una línea y un bus
                  disponible para comenzar.
                </p>

              </div>

            </li>


            {/* PASO 2 */}

            <li>

              <span>
                02
              </span>

              <div>

                <strong>
                  Selecciona el recorrido activo
                </strong>

                <p>
                  Si hay varios recorridos en curso,
                  elige el bus que llegó a la
                  estación.
                </p>

              </div>

            </li>


            {/* PASO 3 */}

            <li>

              <span>
                03
              </span>

              <div>

                <strong>
                  Registra la visita
                </strong>

                <p>
                  Indica cuántas personas viajan
                  en el bus y cuántas esperan
                  para abordar.
                </p>

              </div>

            </li>


            {/* PASO 4 */}

            <li>

              <span>
                04
              </span>

              <div>

                <strong>
                  Revisa el resultado
                </strong>

                <p>
                  El sistema indicará si se
                  necesita apoyo de otra unidad
                  o tiempo adicional.
                </p>

              </div>

            </li>

          </ol>

        </article>


        {/* ÁREA DE TRABAJO */}

        <aside className="operator-dashboard-side">

          <article className="assigned-stations-card">

            <span className="eyebrow-text">
              TU ÁREA DE TRABAJO
            </span>

            <h3>
              Estaciones asignadas
            </h3>


            {stationNames.length > 0 ? (

              <ul className="operator-station-list">

                {stationNames.map(
                  (station) => (
                    <li key={station}>

                      <span
                        className="operator-station-dot"
                        aria-hidden="true"
                      />

                      {station}

                    </li>
                  ),
                )}

              </ul>

            ) : stationCount > 0 ? (

              <p className="operator-stations-fallback">
                Tienes {stationCount} estaciones
                asignadas para tu jornada.
              </p>

            ) : (

              <p className="operator-stations-fallback">
                No tienes estaciones asignadas.
                Solicita la asignación al
                administrador.
              </p>

            )}


            <div className="operator-assistance-note">

              <strong>
                Durante el recorrido
              </strong>

              <p>
                Puedes tener varios recorridos
                abiertos con buses distintos.
                Selecciona el recorrido que
                corresponda antes de registrar
                cada visita.
              </p>

            </div>

          </article>

        </aside>

      </div>

    </section>
  );
}