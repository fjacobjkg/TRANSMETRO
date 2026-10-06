import {
  Menu,
} from "lucide-react";

import {
  Outlet,
} from "react-router-dom";

import {
  useAppLayout,
} from "../hooks/layout/useAppLayout";

import {
  Sidebar,
} from "./Sidebar";


export function AppLayout() {
  const layout =
    useAppLayout();

  const {
    user,
    panels,
    open,
    setOpen,
    loggingOut,
    serviceAvailable,
    healthError,
  } = layout;


  if (!user) {
    return null;
  }


  return (
    <div className="app-shell">

      {/* Accesibilidad */}
      <a
        className="skip-link"
        href="#main-content"
      >
        Saltar al contenido
      </a>


      {/* Fondo móvil */}
      {open && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Cerrar navegación"
          onClick={() =>
            setOpen(false)
          }
        />
      )}


      {/* Sidebar */}
      <Sidebar
        panels={panels}
        user={user}
        open={open}
        loggingOut={loggingOut}
        serviceAvailable={serviceAvailable}
        healthError={healthError}
        onNavigate={() =>
          setOpen(false)
        }
        onLogout={() =>
          void layout.handleLogout()
        }
      />


      {/* Contenido */}
      <div className="main-shell">

        {/* Solo móvil */}
        <div className="mobile-navigation">

          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Abrir navegación"
            aria-expanded={open}
            onClick={() =>
              setOpen(!open)
            }
          >
            <Menu
              size={20}
              aria-hidden="true"
            />
          </button>

          <span className="mobile-navigation-title">
            Transmetro
          </span>

        </div>


        <main
          id="main-content"
          className="content-area"
        >
          <Outlet />
        </main>

      </div>

    </div>
  );
}