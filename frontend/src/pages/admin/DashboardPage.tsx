import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/AuthContext";

import {
  useDashboardData,
} from "../../hooks/dashboard/useDashboardData";

import {
  MetricGrid,
} from "../../components/dashboard/MetricGrid";

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


  const metrics = [
    {
      title: "Líneas operativas",
      value: overview?.lines,
      note: "Rutas configuradas para trabajar",
    },
    {
      title: "Estaciones",
      value: overview?.stations,
      note: "Puntos incluidos en la operación",
    },
    {
      title: "Buses registrados",
      value: overview?.buses,
      note: "Unidades disponibles en la flota",
    },
    {
      title: "Recorridos en curso",
      value: overview?.openTrips,
      note:
        overview?.openTrips
          ? "Operaciones activas en este momento"
          : "No hay recorridos activos",
    },
  ];


  return (
    <section className="dashboard-page admin-dashboard">

      {/* =====================================
          ENCABEZADO
      ====================================== */}

      <PageHeader
        eyebrow="ADMINISTRACIÓN DEL SISTEMA"
        title={
          "Hola, " +
          (user?.name.split(" ")[0] ?? "")
        }
        description="Administra las cuentas, prepara la flota y supervisa la operación desde un solo lugar."
      />


      {/* =====================================
          ESTADO
      ====================================== */}

      <Notice
        error={error}
      />


      {/* =====================================
          RESUMEN
      ====================================== */}

      <MetricGrid
        loading={loading}
        metrics={metrics}
      />


      {/* =====================================
          CONTENIDO PRINCIPAL
      ====================================== */}

      <div className="admin-dashboard-grid">

        

          {/* GUÍA DE ADMINISTRACIÓN */}

          <article className="panel admin-workflow">

            <span className="eyebrow-text">
              GESTIÓN PRINCIPAL
            </span>

            <h2>
              Prepara la operación
            </h2>

            <p className="admin-workflow-description">
              Configura los elementos necesarios
              para que el personal operativo pueda
              iniciar y registrar recorridos.
            </p>


            <ol className="admin-workflow-list">

              <li>
                <span>
                  01
                </span>

                <div>
                  <strong>
                    Administra las cuentas
                  </strong>

                  <p>
                    Crea usuarios y asigna el rol
                    correspondiente a cada persona.
                  </p>

                  <Link
                    to="/admin/users"
                    className="admin-workflow-link"
                  >
                    Ir a cuentas y permisos
                  </Link>
                </div>
              </li>


              <li>
                <span>
                  02
                </span>

                <div>
                  <strong>
                    Prepara la flota
                  </strong>

                  <p>
                    Registra parqueos y buses,
                    y asigna las unidades a una
                    línea operativa.
                  </p>

                  <Link
                    to="/admin/fleet"
                    className="admin-workflow-link"
                  >
                    Ir a flota y parqueos
                  </Link>
                </div>
              </li>


              <li>
                <span>
                  03
                </span>

                <div>
                  <strong>
                    Supervisa la operación
                  </strong>

                  <p>
                    Consulta los recorridos activos
                    y revisa los cambios realizados
                    en el sistema.
                  </p>
                </div>
              </li>

            </ol>

          </article>

        


        {/* ===================================
            TRAZABILIDAD
        ==================================== */}

        <aside className="admin-dashboard-side">

          <article className="help-card admin-control-card">

            <span className="eyebrow-text">
              CONTROL Y TRAZABILIDAD
            </span>

            <h3>
              Revisa la actividad del sistema
            </h3>

            <p>
              Consulta quién realizó cada cambio,
              qué elemento fue afectado y cuándo
              ocurrió.
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
