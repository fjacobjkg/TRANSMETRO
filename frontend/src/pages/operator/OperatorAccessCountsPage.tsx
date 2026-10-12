import { AccessCountForm } from "../../components/operations/AccessCountForm";
import { Notice, PageHeader } from "../../components/ui/PageHeader";
import { useAccessCountsWorkspace } from "../../hooks/operations/useAccessCountsWorkspace";
import "../../styles/pages/operations.css";

export function OperatorAccessCountsPage() {
  const workspace = useAccessCountsWorkspace();
  return (
    <section className="feature-page operations-page operator-access-counts-page">
      <PageHeader eyebrow="CONTROL DE ACCESOS" title="Conteo de accesos"
        description="Registra la cantidad de ingresos según el medio de acceso utilizado en tus estaciones." />
      <Notice error={workspace.error} message={workspace.message} />
      <AccessCountForm
        stationOptions={workspace.stationOptions} stationNames={workspace.stationNames}
        stationId={workspace.stationId} media={workspace.media} selectedMedia={workspace.selectedMedia}
        accessCounts={workspace.accessCounts} userId={workspace.user?.id} quantity={workspace.quantity}
        busy={workspace.busy} onStationChange={workspace.setStationId}
        onMediaChange={workspace.setSelectedMedia} onQuantityChange={workspace.setQuantity}
        onSubmit={workspace.recordCount}
      />
    </section>
  );
}
