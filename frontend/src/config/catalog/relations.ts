import type { Row } from '../../types/table.types';
export type Relation = {path:string;id:string;label:string};
export const relations:Record<string,Relation> = {
  municipalityId:{path:'/api/transport/municipalities',id:'id_municipalidad',label:'Municipalidad'},
  stationId:{path:'/api/transport/stations',id:'id_estacion',label:'Estación'},
  lineId:{path:'/api/transport/lines',id:'id_linea',label:'Línea'},
  parkingId:{path:'/api/fleet/parkings',id:'id_parqueo',label:'Parqueo'},
  busId:{path:'/api/fleet/buses',id:'id_bus',label:'Bus'},
  guardId:{path:'/api/security/guards',id:'id_guardia',label:'Guardia'},
  accessId:{path:'/api/security/accesses',id:'id_acceso',label:'Acceso físico'},
  mediaId:{path:'/api/access-media/media',id:'id_medio_acceso',label:'Medio de pago'},
  pilotId:{path:'/api/personnel/pilots',id:'id_piloto',label:'Piloto'},
  userId:{path:'/api/personnel/operators',id:'id_usuario',label:'Operador'},
};
export function optionLabel(row:Row):string {
  const station=row.estacion as Row|undefined;
  return [row.codigo,row.nombre??row.name??row.nombre_usuario,station?.nombre].filter(Boolean).join(' · ');
}

export function catalogRelationAvailable(resourceKey: string, fieldName: string, row: Row, values: Record<string, string>): boolean {
  if (resourceKey === "pilot-bus" && fieldName === "busId") return row.activo === true &&
    (!(row.asignaciones_piloto as Row[] | undefined)?.length || (row.asignaciones_piloto as Row[]).some(a => String(a.piloto_id) === values.pilotId));
  if (resourceKey === "bus-pilot" && fieldName === "pilotId") return row.activo === true && !(row.asignaciones_bus as Row[] | undefined)?.length;
  if (resourceKey === "assign-line" && fieldName === "busId") return row.activo === true &&
    (values.lineId === "0" || Boolean((row.asignaciones_piloto as Row[] | undefined)?.length));
  return true;
}
