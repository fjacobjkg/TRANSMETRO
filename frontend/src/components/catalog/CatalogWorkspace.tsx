import { useMemo } from "react";
import { getCatalogColumns } from "./catalogColumns";
import "../../styles/catalog.css";
import { Button } from "../ui/Button";
import { Notice, PageHeader } from "../ui/PageHeader";
import { CatalogResourceForm } from "./CatalogResourceForm";
import { CatalogResourceTable } from "./CatalogResourceTable";
import { CatalogResourceTabs } from "./CatalogResourceTabs";
import { useCatalogWorkspace } from "../../hooks/catalog/useCatalogWorkspace";

const titles: Record<string, string> = {
  users: "Cuentas y permisos", transport: "Red de transporte", personnel: "Personal y accesos",
  fleet: "Flota y parqueos", audit: "Bitácora de auditoría",
};

export function CatalogWorkspace({ section }: { section: string }) {
  const workspace = useCatalogWorkspace(section);
  const resource = workspace.resource;
  const columns = useMemo(() => getCatalogColumns(workspace.rows), [workspace.rows]);
  if (!resource) return <div className="empty-state"><strong>No hay recursos disponibles para esta sección.</strong></div>;

  return <section className="feature-page">
    <PageHeader eyebrow="GESTIÓN CENTRALIZADA" title={titles[section] ?? "Catálogo"}
      description="Consulta registros y conserva la trazabilidad de cada cambio."
      actions={<Button variant="secondary" disabled={workspace.busy} onClick={workspace.refresh}>Actualizar</Button>} />
    <CatalogResourceTabs resources={workspace.resources} selected={workspace.selected} onSelect={workspace.setSelected} />
    <Notice error={workspace.formOpen ? "" : workspace.error} message={workspace.message} />
    <CatalogResourceTable resource={resource} rows={workspace.rows} columns={columns} loading={workspace.busy}
      canWrite={workspace.canWrite} adminReadOnly={workspace.user?.role === "ADMINISTRATIVO"}
      onCreate={() => workspace.openForm()} onEdit={workspace.openForm} onSaved={workspace.refresh} />
    {workspace.formOpen && <CatalogResourceForm resource={resource} fields={workspace.formFields}
      values={workspace.values} lookups={workspace.lookups} error={workspace.error} busy={workspace.busy}
      editing={workspace.editing} onChange={(name, value) => workspace.setValues((current) => ({ ...current, [name]: value }))}
      onSubmit={workspace.submit} onClose={() => { if (!workspace.busy) workspace.setFormOpen(false); }} />}
  </section>;
}
