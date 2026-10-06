import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";

import { useAppLayout } from "../hooks/layout/useAppLayout";
import { Sidebar } from "./Sidebar";

import "../styles/operator-layout.css";


export function OperatorLayout() {
  const layout = useAppLayout();

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
    <div className="operator-shell">

      {/* Accesibilidad */}
      <a
        className="operator-skip-link"
        href="#operator-main-content"
      >
        Saltar al contenido
      </a>


      {/* Overlay móvil */}
      {open && (
        <button
          type="button"
          className="operator-sidebar-overlay"
          aria-label="Cerrar navegación"
          onClick={() =>
            setOpen(false)
          }
        />
      )}


      {/* Sidebar compartido */}
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


      {/* Área exclusiva del operador */}
      <div className="operator-main-shell">

        {/* Solo móvil */}
        <div className="operator-mobile-navigation">

          <button
            type="button"
            className="operator-mobile-menu-button"
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

          <span className="operator-mobile-title">
            Transmetro
          </span>

        </div>


        <main
          id="operator-main-content"
          className="operator-content"
        >
          <Outlet />
        </main>

      </div>

    </div>
  );
}