# Frontend de Transmetro

La estructura toma como referencia de Lavandería la separación entre layout, páginas, componentes y estilos; conserva la paleta y las vistas aprobadas de Transmetro.

## Capas visuales

- `styles/tokens.css`: paleta, radios, espacios y sombras.
- `styles/base.css`: reset y estilos base del documento.
- `styles/app.css`: compone CSS compartido, layout y sidebar.
- `styles/components.css`: controles y primitivas comunes; conserva estilos base para inputs, botones, paneles y tablas.
- `styles/components/dashboard.css`: presentación reutilizable de KPIs, accesos y tarjetas informativas.
- `styles/layout.css` y `styles/sidebar.css`: estructura general y sidebar compartido.
- `styles/layout/operator-layout.css`: reglas responsive del layout de operador que ya usa la aplicación.
- `styles/pages/<rol>/<página>.css`: ajustes locales por pantalla. Cada página tiene una clase raíz semántica para que sus cambios no alcancen otros módulos.
- `styles/pages/operations.css`, `styles/catalog.css`, `styles/reports.css` y `styles/network.css`: presentación del módulo o componente que se comparte entre roles.

## Capas de aplicación

- `components/ui`: botones, campos, diálogos, avisos y tablas compartidos.
- `components/<módulo>`: componentes visuales de catálogo, operación, reportes y dashboards.
- `hooks/<módulo>`: estado y acciones existentes de cada módulo.
- `layout`: layout, sidebar, navegación y cuenta.
- `pages/admin`, `pages/administrative`, `pages/operator`: páginas por rol.
- `routes`: rutas y protección existentes.
- `services`: cliente HTTP y llamadas API existentes.
- `types`: contratos de datos y UI.
- `config/catalog`: recursos y relaciones de catálogos.

## Modificar estilos por página

Las hojas de cada pantalla se importan desde su página y se limitan por una raíz semántica, por ejemplo `.operator-dashboard`, `.admin-users-page` o `.administrative-reports-page`. El CSS base de `.button`, `.panel`, `.data-table` y los campos se conserva compartido; los grids y la distribución viven en la pantalla o módulo que los usa.

Login y Sidebar conservan hojas y componentes individuales. Los estilos responsive de cada página están junto con sus reglas de escritorio.

Las páginas y servicios conservan los roles, rutas, permisos y reglas de negocio existentes.
