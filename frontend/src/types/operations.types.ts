export type Station = { id_estacion: number; codigo: string; nombre: string; orden: number };
export type Bus = { id_bus: number; codigo: string; capacidad_maxima: number };
export type LineStation = { estacion_id: number; orden: number; estacion: Station };
export type Line = { id_linea: number; codigo: string; nombre: string; estaciones: LineStation[]; asignaciones_bus: Array<{ bus: Bus }> };
export type Visit = { id_visita: string; orden: number; ocupacion: number; personas_bajan?: number | null; personas_abordan?: number | null; capacidad_registrada?: number; demanda: number; estacion: Station; alerta_unidad_adicional: boolean; espera_adicional_minutos: number; evaluationSource?: string };
export type Trip = { id_recorrido: string | number; fecha_inicio: string; estado: string; linea: { codigo: string; nombre: string; estaciones?: LineStation[] }; bus: Bus; visitas: Visit[] };
export type MediaOption = { id_estacion_medio_acceso: number; activo: boolean; estacion: Station; medio_acceso: { nombre: string } };
export type AccessCount = { id_registro_acceso: string; estacion_medio_acceso_id: number; usuario_id: number; cantidad: number };
