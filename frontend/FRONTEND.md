# Frontend de Transmetro

La organización sigue la referencia de Lavandería. Login conserva su página y estilos individuales.

## Carpetas
- components/ui: controles genéricos (botones, campos, diálogos, tablas).
- components/catalog, operations, reports, dashboard: presentación reutilizable de cada módulo.
- hooks: estado y acciones por módulo; layout y sesión compartidos.
- layout: AppLayout, Sidebar, navegación y cuenta. AppLayout renderiza las páginas mediante Outlet.
- pages/admin: dashboard y páginas del administrador.
- pages/administrative: dashboard y páginas de consulta del administrativo.
- pages/operator: dashboard y operación de estación.
- routes: rutas explícitas, protección por sesión y por rol.
- services: cliente HTTP y llamadas API por módulo.
- styles: tokens del login, base genérica, layout, componentes, módulos y CSS propio de cada rol.
- types: contratos de dominio, navegación y tablas.
- config/catalog: definición de catálogos y relaciones.
- utils: exportación CSV y navegación por rol.

## Navegación
ADMIN → /admin/dashboard
ADMINISTRATIVO → /administrativo/dashboard
OPERADOR_ESTACION → /operador/dashboard

Las rutas antiguas /dashboard y /dashboard/:modulo redirigen al espacio correspondiente al rol.
El backend sigue siendo responsable de aplicar permisos y validar las operaciones.

## Extender un módulo
Añadir su servicio y tipos; encapsular estado en hooks; componer componentes en una página; registrar la ruta y la navegación en utils/role-routing.ts.
Usar variables de styles/tokens.css para mantener la paleta del login.
