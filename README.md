# Transmetro

Sistema web para la gestión operativa de una red de transporte. Permite configurar líneas y estaciones, administrar buses y personal, registrar recorridos y consultar información histórica desde una interfaz organizada por roles.

El proyecto reúne un frontend en React y una API en Express, con TypeScript, Prisma y MySQL.

## Funcionalidades

- **Red de transporte:** municipalidades, líneas, estaciones, orden de paradas y distancias.
- **Flota y parqueos:** buses, parqueos y asignaciones con historial.
- **Personal y accesos:** pilotos, operadores, guardias, accesos físicos y medios de pago habilitados por estación.
- **Operación:** inicio de recorridos, registro secuencial de visitas y movimientos de pasajeros, alertas de demanda y espera adicional.
- **Seguimiento y reportes:** consulta de recorridos, operación registrada, recaudación estimada, asignaciones de flota y exportación CSV.
- **Administración:** cuentas, roles y bitácora de acciones.

La recaudación es una estimación informativa: el sistema no procesa cobros ni administra saldos de pasajeros.

## Roles

| Rol | Uso principal |
| --- | --- |
| Administrador | Configuración de la red, cuentas, personal, seguridad, flota, seguimiento y reportes. |
| Operador de estación | Operación y consultas dentro de las estaciones y líneas autorizadas. |

El rol Administrativo se conserva internamente y está deshabilitado temporalmente en el frontend mediante `frontend/src/config/features.ts`.

## Capturas de pantalla

Estas secciones pueden actualizarse reemplazando las imágenes de `docs/capturas/` y conservando sus nombres, o modificando los enlaces.

### Panel de administración

![Panel de administración de Transmetro](docs/capturas/dashboard.jpg)

### Red de transporte

![Editor de líneas y estaciones](docs/capturas/editor.jpg)

### Consultas y reportes

![Consultas y reportes de Transmetro](docs/capturas/reportes.jpg)

### Operación de estación

> Espacio para una captura del flujo del operador.


![Registro de recorridos y visitas](docs/capturas/operacion.jpg)


## Tecnologías

| Área | Tecnologías |
| --- | --- |
| Frontend | React, TypeScript, Vite y Lucide. |
| Backend | Node.js, Express, TypeScript y Zod. |
| Datos y autenticación | MySQL, Prisma, contraseñas con hash y sesión mediante cookie HttpOnly. |
| Pruebas | Vitest, Supertest y Node Test Runner. |

## Requisitos

- Node.js **24 o superior**, con npm.
- MySQL **8 o superior**, instalado y en ejecución.
- Git para clonar el repositorio, o una copia descargada como ZIP.
- Un usuario de MySQL con permisos sobre la base de la aplicación.

MySQL Workbench es opcional; funciona como cliente y no sustituye al servidor de MySQL.

## Descargar el proyecto

```bash
git clone https://github.com/fjacobjkg/TRANSMETRO.git
cd TRANSMETRO
```

También puedes usar **Code → Download ZIP** desde el [repositorio](https://github.com/fjacobjkg/TRANSMETRO), extraerlo y abrir una terminal en la carpeta que contiene `package.json`.

## Instalación y configuración local

Los siguientes comandos se ejecutan desde la raíz del proyecto. En Windows se usa `npm.cmd` para evitar restricciones de PowerShell sobre `npm.ps1`; en macOS o Linux utiliza `npm`.

### 1. Instalar dependencias

```powershell
npm.cmd run install:all
```

### 2. Crear una base vacía

Para una instalación nueva, ejecuta lo siguiente en MySQL con una cuenta administradora. Sustituye la contraseña antes de ejecutarlo:

```sql
CREATE DATABASE IF NOT EXISTS transmetro
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'transmetro_app'@'localhost'
  IDENTIFIED BY 'CAMBIA_POR_TU_CONTRASENA_MYSQL';

GRANT ALL PRIVILEGES ON transmetro.*
  TO 'transmetro_app'@'localhost';
```

Si el usuario ya existe, utiliza su contraseña actual: `CREATE USER IF NOT EXISTS` no la modifica. Si ya tienes una base configurada para este proyecto, conserva sus datos y adapta las variables del siguiente paso.

### 3. Configurar el backend

Crea `backend/.env` con tu configuración. Si ya existe, edítalo sin reemplazar tus credenciales:

```dotenv
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5174

DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=transmetro_app
DATABASE_PASSWORD="CAMBIA_POR_TU_CONTRASENA_MYSQL"
DATABASE_NAME=transmetro
DATABASE_URL="mysql://transmetro_app:CONTRASENA_CODIFICADA@127.0.0.1:3306/transmetro"

JWT_SECRET="CAMBIA_POR_UN_SECRETO_ALEATORIO_DE_AL_MENOS_32_CARACTERES"
JWT_EXPIRES_IN=3600

INITIAL_ADMIN_NAME="Administrador Transmetro"
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD="CAMBIA_POR_TU_CONTRASENA_ADMIN"
```

Reemplaza todos los valores de ejemplo. La contraseña del administrador debe tener al menos 12 caracteres e incluir mayúscula, minúscula y número. `JWT_SECRET` debe ser un secreto aleatorio propio de esta instalación.

`DATABASE_URL` y las variables `DATABASE_*` deben apuntar a la misma base con las mismas credenciales. En la URL, codifica los caracteres especiales de la contraseña: por ejemplo, `@` se escribe `%40` y `#`, `%23`. En `DATABASE_PASSWORD` conserva la contraseña sin codificar.

Los archivos `.env` son privados y están excluidos de Git.

### 4. Crear las tablas y el administrador

Sobre la base nueva configurada en el paso anterior:

```powershell
npm.cmd --prefix backend run db:migrate:deploy
npm.cmd --prefix backend run db:seed
```

Las migraciones crean el esquema y el seed registra los roles y el administrador definido en `INITIAL_ADMIN_*`. Si esa cuenta ya existe, conserva su contraseña y estado. Estos comandos no copian los datos de otra instalación.

Para una base existente, revisa su historial de migraciones antes de aplicar cambios. No combines la creación manual de tablas con las migraciones de una instalación nueva.

### 5. Configurar el frontend

Para una instalación nueva en PowerShell:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

Si `frontend/.env` ya existe, conserva el archivo. El valor esperado para esta configuración local es:

```dotenv
VITE_PROXY_TARGET=http://127.0.0.1:3001
```

## Ejecutar el proyecto

Abre dos terminales en la raíz del proyecto.

**Terminal 1 — API:**

```powershell
npm.cmd run dev:backend
```

**Terminal 2 — Interfaz:**

```powershell
npm.cmd run dev:frontend
```

| Servicio | Dirección local |
| --- | --- |
| Aplicación | http://localhost:5174 |
| Estado de la API y conexión a MySQL | http://localhost:3001/api/health |

Inicia sesión con el usuario y contraseña que configuraste para el administrador. Desde la aplicación puedes crear las cuentas de operador y preparar la red de transporte.

Si cambias los puertos, actualiza también `PORT`, `CORS_ORIGIN` y `VITE_PROXY_TARGET` para que coincidan. Reinicia los procesos después de cambiar variables de entorno.

### Datos de demostración opcionales

En una base de pruebas, después de crear el administrador y al menos una cuenta activa de operador desde la aplicación, puedes cargar los ejemplos incluidos:

```powershell
npm.cmd --prefix backend run db:seed:demo
```

Este seed crea y actualiza registros con códigos fijos de demostración. Utilízalo solo en una base de pruebas que puedas modificar; no es necesario para ejecutar la aplicación con tus propios datos.

## Verificación y compilación

Desde la raíz, con las dependencias instaladas y el backend configurado:

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run build
```

Estos comandos verifican tipos, ejecutan las pruebas automatizadas y generan la compilación de backend y frontend. No levantan los servidores de desarrollo. Las pruebas de integración manuales tienen comandos separados en `backend/package.json`.

## Estructura

```text
TRANSMETRO/
├── backend/              API, reglas de negocio, Prisma y migraciones
├── frontend/             Interfaz, componentes compartidos y vistas por rol
├── docs/                 Documentación técnica y capturas
├── package.json          Comandos del proyecto
└── README.md             Descripción e instalación
```

Documentación complementaria:

- [Arquitectura y requisitos](docs/ARQUITECTURA_Y_REQUISITOS.md).
- [Modelo y adaptación de la base original](docs/ADAPTACION_BASE_ORIGINAL.md).
- [Organización del frontend](frontend/FRONTEND.md).

## Problemas frecuentes

| Problema | Revisión |
| --- | --- |
| PowerShell bloquea `npm.ps1` | Ejecuta `npm.cmd`. |
| No conecta con MySQL | Comprueba que el servidor esté iniciado y revisa host, puerto, usuario y contraseña. |
| Prisma no conecta o rechaza credenciales | Revisa `DATABASE_URL` y la codificación de caracteres especiales. |
| Faltan tablas | Comprueba que se aplicaron las migraciones en la base indicada por el entorno. |
| El frontend muestra un error de conexión | Confirma que la API esté iniciada en el destino de `VITE_PROXY_TARGET`. |
| No puedes iniciar sesión | Usa las credenciales definidas para esa instalación; el repositorio no incluye cuentas privadas. |
