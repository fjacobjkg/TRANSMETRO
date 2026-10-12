import { Badge, textValue, type Column, type Row } from "../ui/DataTable";
import { paymentCurrency } from "../../utils/payment-simulation-report";

const labels: Record<string, string> = {
  nombre: "Nombre", codigo: "Código", nombre_usuario: "Usuario", activo: "Estado", placa: "Placa",
  capacidad_maxima: "Capacidad", municipalidad: "Municipalidad", estacion: "Estación", rol: "Rol",
  creado_en: "Creación", residencia: "Residencia", informacion_educativa: "Formación", telefono: "Teléfono",
  correo: "Correo", fecha_hora: "Fecha y hora", accion: "Acción", entidad: "Entidad", descripcion: "Descripción",
  usuario: "Responsable", distanciaTotal: "Distancia total (km)", estaciones: "Estaciones en orden",
  tarifa: "Tarifa", estaciones_habilitadas: "Estaciones habilitadas", bus_asignado: "Bus asignado", piloto_asignado: "Piloto asignado",
  asignaciones_bus: "Buses asignados", asignaciones_linea: "Línea vigente", asignaciones_parqueo: "Parqueo vigente",
  asignaciones_estacion: "Estaciones asignadas", asignaciones_guardia: "Guardias asignados", id_entidad: "Referencia",
};
const preferred = [
  "codigo", "nombre", "nombre_usuario", "rol", "placa", "capacidad_maxima", "municipalidad", "estacion",
  "distanciaTotal", "residencia", "telefono", "correo", "asignaciones_linea", "asignaciones_parqueo",
  "asignaciones_estacion", "asignaciones_guardia", "activo", "fecha_hora", "accion", "entidad", "descripcion", "usuario",
  "bus_asignado", "piloto_asignado",
];

export function getCatalogColumns(rows: Row[]): Column[] {
    const order = rows.some(row => row.tarifa !== undefined)
      ? ["nombre", "tarifa", "activo", "estaciones_habilitadas", "descripcion"] : preferred;
    const keys = order.filter((key) => rows.some((row) => row[key] !== undefined));
    return keys.map((key) => ({
      key, label: labels[key] ?? key,
      render: (row) => key === "activo" ? <Badge value={row[key]} />
        : key === "tarifa" ? paymentCurrency(String(row[key]))
        : key === "estaciones_habilitadas" ? `${String(row[key])} estaciones`
        : key === "piloto_asignado" && row[key] === "Sin asignar" ? <Badge value="Sin asignar" />
        : key.includes("fecha") || key === "creado_en"
          ? new Date(String(row[key])).toLocaleString("es-GT") : textValue(row[key]),
    }));

}
