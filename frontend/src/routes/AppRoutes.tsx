import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { LoginPage } from "../pages/LoginPage";

import { AppLayout } from "../layout/AppLayout";

import { RoleRedirect } from "./RoleRedirect";
import { ProtectedRoute } from "./ProtectedRoute";

import { AdminDashboardPage } from "../pages/admin/DashboardPage";
import { AdminUsersPage } from "../pages/admin/UsersPage";
import { AdminTransportPage } from "../pages/admin/TransportPage";
import { AdminPersonnelPage } from "../pages/admin/PersonnelPage";
import { AdminFleetPage } from "../pages/admin/FleetPage";
import { AdminOperationsPage } from "../pages/admin/OperationsPage";
import { AdminReportsPage } from "../pages/admin/ReportsPage";
import { AdminAuditPage } from "../pages/admin/AuditPage";

import { AdministrativeDashboardPage } from "../pages/administrative/DashboardPage";
import { AdministrativeTransportPage } from "../pages/administrative/TransportPage";
import { AdministrativePersonnelPage } from "../pages/administrative/PersonnelPage";
import { AdministrativeFleetPage } from "../pages/administrative/FleetPage";
import { AdministrativeReportsPage } from "../pages/administrative/ReportsPage";

import { OperatorDashboardPage } from "../pages/operator/DashboardPage";
import { OperatorOperationsPage } from "../pages/operator/OperationsPage";


import { OperatorAccessCountsPage } from "../pages/operator/OperatorAccessCountsPage";

export function AppRoutes() {
  return (
    <Routes>

      <Route
        path="/login"
        element={<LoginPage />}
      />


      {/* =====================================
          ADMIN
      ====================================== */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["ADMIN"]}
          />
        }
      >
        <Route
          path="/admin"
          element={<AppLayout />}
        >
          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={<AdminDashboardPage />}
          />

          <Route
            path="users"
            element={<AdminUsersPage />}
          />

          <Route
            path="transport"
            element={<AdminTransportPage />}
          />

          <Route
            path="personnel"
            element={<AdminPersonnelPage />}
          />

          <Route
            path="fleet"
            element={<AdminFleetPage />}
          />

          <Route
            path="operations"
            element={<AdminOperationsPage />}
          />

          <Route
            path="reports"
            element={<AdminReportsPage />}
          />

          <Route
            path="audit"
            element={<AdminAuditPage />}
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />
        </Route>
      </Route>


      {/* =====================================
          ADMINISTRATIVO
      ====================================== */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "ADMINISTRATIVO",
            ]}
          />
        }
      >
        <Route
          path="/administrativo"
          element={<AppLayout />}
        >
          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <AdministrativeDashboardPage />
            }
          />

          <Route
            path="transport"
            element={
              <AdministrativeTransportPage />
            }
          />

          <Route
            path="personnel"
            element={
              <AdministrativePersonnelPage />
            }
          />

          <Route
            path="fleet"
            element={
              <AdministrativeFleetPage />
            }
          />

          <Route
            path="reports"
            element={
              <AdministrativeReportsPage />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/administrativo/dashboard"
                replace
              />
            }
          />
        </Route>
      </Route>


   {/* =====================================
    OPERADOR DE ESTACIÓN
===================================== */}

<Route
  element={
    <ProtectedRoute
      allowedRoles={["OPERADOR_ESTACION"]}
    />
  }
>
  <Route
    path="/operador"
    element={<AppLayout />}
  >
    <Route
      index
      element={
        <Navigate
          to="dashboard"
          replace
        />
      }
    />

    <Route
      path="dashboard"
      element={
        <OperatorDashboardPage />
      }
    />

    <Route
      path="operations"
      element={
        <OperatorOperationsPage />
      }
    />

    <Route path="access-counts" element={<OperatorAccessCountsPage />} />

    <Route
      path="*"
      element={
        <Navigate
          to="/operador/dashboard"
          replace
        />
      }
    />
  </Route>
</Route>


      {/* =====================================
          REDIRECCIONES
      ====================================== */}

      <Route
        element={<ProtectedRoute />}
      >
        <Route
          path="/dashboard/*"
          element={
            <RoleRedirect
              preserveModule
            />
          }
        />

        <Route
          path="/"
          element={<RoleRedirect />}
        />

        <Route
          path="*"
          element={<RoleRedirect />}
        />
      </Route>

    </Routes>
  );
}