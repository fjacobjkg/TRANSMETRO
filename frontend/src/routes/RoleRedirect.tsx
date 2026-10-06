import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { getHomeRouteByRole, getPanelsByRole } from "../utils/role-routing";

export function RoleRedirect({ preserveModule = false }: { preserveModule?: boolean }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  const module = preserveModule ? location.pathname.split("/")[2] : undefined;
  const panel = getPanelsByRole(user.role).find((item) => item.id === module);
  return <Navigate to={panel?.path ?? getHomeRouteByRole(user.role)} replace />;
}
