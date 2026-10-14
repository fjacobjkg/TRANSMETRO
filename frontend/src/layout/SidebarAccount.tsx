import {
  ChevronDown,
  LogOut,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  AuthUser,
} from "../types/auth";

import {
  roleLabel,
} from "../utils/role-routing";

interface SidebarAccountProps {
  user: AuthUser;
  loggingOut: boolean;
  serviceAvailable: boolean;
  healthError: boolean;
  onLogout: () => void;
}

export function SidebarAccount({
  user,
  loggingOut,
  onLogout,
}: SidebarAccountProps) {
  const [open, setOpen] =
    useState(false);

  const initial =
    user.name
      .trim()
      .slice(0, 1)
      .toUpperCase();

  return (
    <div className="sidebar-user-menu">

      {/* Usuario */}
      <button
        type="button"
        className={`sidebar-user-trigger ${
          open
            ? "sidebar-user-trigger--open"
            : ""
        }`}
        aria-expanded={open}
        onClick={() =>
          setOpen(
            (current) => !current,
          )
        }
      >
        <span
          className="sidebar-user-avatar"
          aria-hidden="true"
        >
          {initial}
        </span>

        <span className="sidebar-user-info">
          <small>
            Sesión actual
          </small>

          <strong>
            {user.name}
          </strong>

          <span>
            {roleLabel(user.role)}
          </span>
        </span>

        <ChevronDown
          className="sidebar-user-chevron"
          size={16}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </button>

      {/* Menú */}
      {open && (
        <div className="sidebar-user-dropdown">
          <button
            type="button"
            className="sidebar-user-logout"
            disabled={loggingOut}
            onClick={onLogout}
          >
            <LogOut
              className="sidebar-user-logout-icon"
              size={16}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            {loggingOut
              ? "Cerrando sesión…"
              : "Cerrar sesión"}
          </button>
        </div>
      )}
    </div>
  );
}
