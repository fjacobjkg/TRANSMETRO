import type { ReactNode } from "react";
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
  canCreate?: boolean;
  createLabel?: string;
  rowActions?: (row: Row) => ReactNode;

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
  canCreate = canWrite,
  createLabel,
  rowActions,
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


        {canCreate &&
          resource.key !==
            "line-stations" && (
          <Button
            variant="primary"
            onClick={onCreate}
          >
            {createLabel ?? (resource.method ===
              "POST" &&
            !resource.writePath
              ? "＋ Crear registro"
              : "Configurar")}
          </Button>
        )}

      </div>

      {resource.helpText && <p className="muted">{resource.helpText}</p>}


      {resource.key ===
        "line-stations" &&
      canWrite ? (
        <LineOrderEditor
          onSaved={onSaved}
        />
      ) : (
        <DataTable
          resetKey={resource.key}
          rows={rows}
          columns={columns}
          loading={loading}
          pageSize={pageSize}
          actions={
            canEditRows || rowActions
              ? (row) => (
                  <>
                  {canEditRows &&
                  <Button
                    variant="quiet"
                    onClick={() =>
                      onEdit(row)
                    }
                  >
                    Editar
                  </Button>}
                  {rowActions?.(row)}
                  </>
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
