import {
  Button,
} from "../ui/Button";

import {
  DataTable,
  type Column,
  type Row,
} from "../ui/DataTable";

import {
  LineOrderEditor,
} from "./LineOrderEditor";

import type {
  Resource,
} from "../../types/catalog.types";


const editableKeys =
  new Set([
    "municipalities",
    "stations",
    "lines",
    "pilots",
    "guards",
    "accesses",
    "media",
    "parkings",
    "buses",
  ]);


interface CatalogResourceTableProps {
  resource: Resource;
  rows: Row[];
  columns: Column[];
  loading: boolean;
  canWrite: boolean;
  adminReadOnly: boolean;

  pageSize?: number;

  onCreate: () => void;
  onEdit: (row: Row) => void;
  onSaved: () => void;
}


export function CatalogResourceTable({
  resource,
  rows,
  columns,
  loading,
  canWrite,
  adminReadOnly,
  pageSize,
  onCreate,
  onEdit,
  onSaved,
}: CatalogResourceTableProps) {
  const canEditRows =
    canWrite &&
    editableKeys.has(
      resource.key,
    );


  return (
    <article className="panel">

      <div className="panel-heading">

        <div>
          <h2>
            {resource.title}
          </h2>

          <p>
            {resource.description}
          </p>
        </div>


        {canWrite &&
          resource.key !==
            "line-stations" && (
          <Button
            variant="primary"
            onClick={onCreate}
          >
            {resource.method ===
              "POST" &&
            !resource.writePath
              ? "＋ Crear registro"
              : "Configurar"}
          </Button>
        )}

      </div>


      {resource.key ===
        "line-stations" &&
      canWrite ? (
        <LineOrderEditor
          onSaved={onSaved}
        />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          pageSize={pageSize}
          actions={
            canEditRows
              ? (row) => (
                  <Button
                    variant="quiet"
                    onClick={() =>
                      onEdit(row)
                    }
                  >
                    Editar
                  </Button>
                )
              : undefined
          }
        />
      )}


      {adminReadOnly && (
        <p className="read-only-note">
          Consulta administrativa · Tu rol tiene
          acceso de lectura.
        </p>
      )}

    </article>
  );
}