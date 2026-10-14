import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/AuthContext";
import { getHomeRouteByRole } from "../utils/role-routing";
import type { UserRole } from "../types/auth";
import { useState } from "react";
import { isFrontendRoleEnabled, DISABLED_ROLE_MESSAGE } from "../config/features";
import { Button } from "../components/ui/Button";
import { Notice } from "../components/ui/PageHeader";

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  async function leaveDisabledRole() {
    setLoggingOut(true);
    try { await logout(); }
    catch { /* AuthContext clears the local session even if the request fails. */ }
    finally { setLoggingOut(false); }
  }

  if (loading) return <main className="auth-loading">Verificando sesión…</main>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!isFrontendRoleEnabled(user.role)) return <main className="auth-loading">
    <section className="panel"><Notice error={DISABLED_ROLE_MESSAGE} />
      <Button variant="secondary" disabled={loggingOut} onClick={() => void leaveDisabledRole()}>
        {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
      </Button>
    </section>
  </main>;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={getHomeRouteByRole(user.role)} replace />;
  return <Outlet />;
}
