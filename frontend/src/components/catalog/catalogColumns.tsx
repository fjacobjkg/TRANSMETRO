import { Badge, textValue, type Column, type Row } from "../ui/DataTable";

const labels: Record<string, string> = {
  nombre: "Nombre", codigo: "Código", nombre_usuario: "Usuario", activo: "Estado", placa: "Placa",
  capacidad_maxima: "Capacidad", municipalidad: "Municipalidad", estacion: "Estación", rol: "Rol",
  creado_en: "Creación", residencia: "Residencia", informacion_educativa: "Formación", telefono: "Teléfono",
  correo: "Correo", fecha_hora: "Fecha y hora", accion: "Acción", entidad: "Entidad", descripcion: "Descripción",
  usuario: "Responsable", distanciaTotal: "Distancia total (km)", estaciones: "Estaciones en orden",
  asignaciones_bus: "Buses asignados", asignaciones_linea: "Línea vigente", asignaciones_parqueo: "Parqueo vigente",
  asignaciones_estacion: "Estaciones asignadas", asignaciones_guardia: "Guardias asignados", id_entidad: "Referencia",
};
const preferred = [
  "codigo", "nombre", "nombre_usuario", "rol", "placa", "capacidad_maxima", "municipalidad", "estacion",
  "distanciaTotal", "residencia", "telefono", "correo", "asignaciones_linea", "asignaciones_parqueo",
  "asignaciones_estacion", "asignaciones_guardia", "activo", "fecha_hora", "accion", "entidad", "descripcion", "usuario",
];

export function getCatalogColumns(rows: Row[]): Column[] {
    const keys = preferred.filter((key) => rows.some((row) => row[key] !== undefined));
    return keys.map((key) => ({
      key, label: labels[key] ?? key,
      render: (row) => key === "activo" ? <Badge value={row[key]} />
        : key.includes("fecha") || key === "creado_en"
          ? new Date(String(row[key])).toLocaleString("es-GT") : textValue(row[key]),
    }));

}
