import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAppLayout } from "../hooks/layout/useAppLayout";
import { roleLabel } from "../utils/role-routing";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const layout = useAppLayout();
  const { user, panels, activePanel, open, setOpen, loggingOut, serviceAvailable, healthError } = layout;
  if (!user) return null;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      {open && <button type="button" className="sidebar-overlay" aria-label="Cerrar navegación" onClick={() => setOpen(false)} />}
      <Sidebar panels={panels} user={user} open={open} loggingOut={loggingOut}
        serviceAvailable={serviceAvailable} healthError={healthError}
        onNavigate={() => setOpen(false)} onLogout={() => void layout.handleLogout()} />
      <div className="main-shell">
        <header className="action-bar">
          <Button variant="quiet" className="mobile-menu-button" aria-label="Abrir navegación"
            aria-expanded={open} onClick={() => setOpen(!open)}><Menu size={18} /></Button>
          <div className="breadcrumb"><span>Transmetro</span><span aria-hidden="true">/</span><strong>{activePanel?.title}</strong></div>
          <div className="action-bar-right">
            <span className="role-chip">{roleLabel(user.role)}</span>
            <time className="today-date" dateTime={new Date().toISOString().slice(0, 10)}>
              {new Date().toLocaleDateString("es-GT", { day: "numeric", month: "long" })}
            </time>
          </div>
        </header>
        <main id="main-content" className="content-area"><Outlet /></main>
        <footer className="app-footer">Transmetro · Control interno<span>Guatemala · Datos centralizados</span></footer>
      </div>
    </div>
  );
}
