import {
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getCatalogColumns,
} from "./catalogColumns";

import "../../styles/catalog.css";

import {
  Button,
} from "../ui/Button";

import {
  Notice,
  PageHeader,
} from "../ui/PageHeader";

import {
  CatalogResourceForm,
} from "./CatalogResourceForm";

import {
  CatalogResourceTable,
} from "./CatalogResourceTable";

import {
  CatalogResourceTabs,
} from "./CatalogResourceTabs";

import {
  useCatalogWorkspace,
} from "../../hooks/catalog/useCatalogWorkspace";
import { contextFormResource, type CatalogContextAction, type CatalogView } from "../../config/catalog/administration";
import { resourcesBySection } from "../../config/catalog/resources";
import type { Row } from "../../types/table.types";
import { Badge } from "../ui/DataTable";
import { Dialog } from "../ui/Dialog";
import { LineOrderEditor } from "./LineOrderEditor";

const allResources = Object.values(resourcesBySection).flat();


const titles: Record<string, string> = {
  users: "Cuentas y permisos",
  transport: "Red de transporte",
  personnel: "Personal y accesos",
  fleet: "Flota y parqueos",
  audit: "Bitácora de auditoría",
};


interface CatalogWorkspaceProps {
  section: string;
  showRefreshAction?: boolean;
  pageSize?: number;
  consultationMode?: boolean;
  view?: CatalogView;
  extraTabs?: Array<{ key: string; title: string; content: ReactNode }>;
}


export function CatalogWorkspace({
  section,
  showRefreshAction = true,
  pageSize,
  consultationMode = false,
  view,
  extraTabs = [],
}: CatalogWorkspaceProps) {
  const workspace =
    useCatalogWorkspace(section, view?.resourceKeys);
  const [selectedExtraTab, setSelectedExtraTab] = useState<string | null>(null);
  const [configuredLine, setConfiguredLine] = useState<Row | null>(null);
  const [lineEditorBusy, setLineEditorBusy] = useState(false);
  const orderedResources = view
    ? view.resourceKeys.flatMap(key => workspace.resources.filter(item => item.key === key))
    : workspace.resources;
  const extraTab = extraTabs.find(tab => tab.key === selectedExtraTab);

  const resource =
    workspace.resource;
  const adminActions = workspace.user?.role === "ADMIN";
  const createAction = resource ? view?.createActions?.[resource.key] : undefined;
  const contextualActions = resource ? view?.rowActions[resource.key] : undefined;

  function openContextForm(action: CatalogContextAction, row?: Row) {
    const target = contextFormResource(action, allResources);
    if (!target || !adminActions) return;
    if (target.key === "line-stations" && row) {
      setConfiguredLine(row);
      return;
    }
    workspace.openForm(null, target, { ...action.initialValues, ...(row ? action.valuesFromRow?.(row) : {}) });
  }

  const columns =
    useMemo(
      () => {
        const inactiveLabel = resource ? view?.inactiveLabels?.[resource.key] : undefined;
        return getCatalogColumns(workspace.rows).map(column => column.key === "activo" && inactiveLabel
          ? { ...column, render: (row: Row) => <Badge value={row.activo === false ? inactiveLabel : row.activo} /> }
          : column);
      },
      [workspace.rows, resource, view],
    );


  if (!resource) {
    return (
      <div className="empty-state">

        <strong>
          No hay recursos disponibles
          para esta sección.
        </strong>

      </div>
    );
  }


  return (
    <section className="feature-page">

      <PageHeader
        eyebrow="GESTIÓN CENTRALIZADA"
        title={
          view?.title ?? titles[section] ??
          "Catálogo"
        }
        description={view?.description ?? "Consulta registros y conserva la trazabilidad de cada cambio."}
        actions={
          showRefreshAction
            ? (
                <Button
                  variant="secondary"
                  disabled={workspace.busy}
                  onClick={workspace.refresh}
                >
                  Actualizar
                </Button>
              )
            : undefined
        }
      />


      {consultationMode && (
        <div
          className="consultation-notice"
          role="note"
        >
          <span
            className="consultation-notice-icon"
            aria-hidden="true"
          >
            !
          </span>

          <div>
            <strong>
              Modo de consulta
            </strong>

            <p>
              Puedes consultar la información registrada,
              pero este perfil no permite crear, editar ni
              configurar registros.
            </p>
          </div>
        </div>
      )}


      <CatalogResourceTabs
        resources={[...orderedResources, ...extraTabs]}
        selected={extraTab?.key ?? workspace.selected}
        onSelect={key => {
          if (extraTabs.some(tab => tab.key === key)) setSelectedExtraTab(key);
          else { setSelectedExtraTab(null); workspace.setSelected(key); }
        }}
      />


      {extraTab ? extraTab.content : <>
      <Notice
        error={
          workspace.formOpen
            ? ""
            : workspace.error
        }
        message={workspace.message}
      />


      <CatalogResourceTable
          resource={resource}
          rows={workspace.rows}
          columns={columns}
          loading={workspace.busy}
          canWrite={workspace.canWrite}
          adminReadOnly={
            workspace.user?.role ===
            "ADMINISTRATIVO"
          }
          pageSize={pageSize}
          canCreate={workspace.canWrite || Boolean(adminActions && createAction)}
          createLabel={createAction ? String(createAction.label) : view?.createLabels?.[resource.key]}
          rowActions={adminActions && contextualActions ? row => contextualActions.map(action => <Button
            key={action.resourceKey} variant="quiet" disabled={workspace.busy} onClick={() => openContextForm(action, row)}>
            {typeof action.label === "function" ? action.label(row) : action.label}
          </Button>) : undefined}
          onCreate={() =>
            createAction ? openContextForm(createAction) : workspace.openForm()
          }
          onEdit={row => workspace.openForm(row)}
          onSaved={workspace.refresh}
        />
      </>}


      {workspace.formOpen && workspace.formResource && (
        <CatalogResourceForm
          resource={workspace.formResource}
          fields={workspace.formFields}
          values={workspace.values}
          lookups={workspace.lookups}
          error={workspace.error}
          busy={workspace.busy}
          editing={workspace.editing}
          onChange={(name, value) =>
            workspace.setValues(
              (current) => ({
                ...current,
                [name]: value,
              }),
            )
          }
          onSubmit={workspace.submit}
          onClose={workspace.closeForm}
        />
      )}

      {configuredLine && <Dialog
        title={`Configurar estaciones · ${String(configuredLine.codigo)} · ${String(configuredLine.nombre)}`}
        onClose={() => { if (!lineEditorBusy) setConfiguredLine(null); }}>
        <LineOrderEditor initialLineId={String(configuredLine.id_linea)} onSaved={workspace.refresh}
          onBusyChange={setLineEditorBusy} />
      </Dialog>}

    </section>
  );
}
