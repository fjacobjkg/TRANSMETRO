import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getPanelsByRole } from "../../utils/role-routing";
import { useServiceHealth } from "./useServiceHealth";

export function useAppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const health = useServiceHealth();
  const panels = user ? getPanelsByRole(user.role) : [];
  const activePanel = panels.find((panel) => panel.path === location.pathname) ?? panels[0];

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    try { await logout(); } catch { /* La sesión local se limpia incluso si falla la API. */ }
    finally { setLoggingOut(false); navigate("/login", { replace: true }); }
  }
  return { user, panels, activePanel, open, setOpen, loggingOut, handleLogout, ...health };
}
