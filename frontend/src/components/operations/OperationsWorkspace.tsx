import "../../styles/operations.css";
import { Button } from "../ui/Button";
import { Notice, PageHeader } from "../ui/PageHeader";
import { useOperationsWorkspace } from "../../hooks/operations/useOperationsWorkspace";
import { AccessCountForm } from "./AccessCountForm";
import { CancelTripDialog } from "./CancelTripDialog";
import { TripStartForm } from "./TripStartForm";
import { TripsTable } from "./TripsTable";
import { VisitForm } from "./VisitForm";
export function OperationsWorkspace() {
  const workspace = useOperationsWorkspace();
  return <section className="feature-page">
    <PageHeader eyebrow="OPERACIÓN DE ESTACIONES" title="Recorridos y registros"
      description="Registra cada recorrido y conserva el orden de estaciones, la demanda y las evaluaciones."
      actions={<Button variant="secondary" disabled={workspace.busy} onClick={workspace.refresh}>Actualizar</Button>} />
    <Notice error={workspace.error} message={workspace.message} />
    <div className="work-grid">
      <TripStartForm lines={workspace.lines} trips={workspace.trips} line={workspace.line}
        selectedLine={workspace.selectedLine} selectedBus={workspace.selectedBus} busy={workspace.busy}
        onLineChange={workspace.setSelectedLine} onBusChange={workspace.setSelectedBus} onSubmit={workspace.startTrip} />
      <VisitForm trips={workspace.trips} selectedTrip={workspace.selectedTrip} activeTrip={workspace.activeTrip}
        nextStation={workspace.nextStation} occupancy={workspace.occupancy} demand={workspace.demand}
        busy={workspace.busy} canRecordNext={workspace.canRecordNext} onTripChange={workspace.setSelectedTrip}
        onOccupancyChange={workspace.setOccupancy} onDemandChange={workspace.setDemand} onSubmit={workspace.recordVisit} />
      {workspace.user?.role === "OPERADOR_ESTACION" && <AccessCountForm
        stationOptions={workspace.stationOptions} stationNames={workspace.stationNames} stationId={workspace.stationId}
        media={workspace.media} selectedMedia={workspace.selectedMedia} accessCounts={workspace.accessCounts}
        userId={workspace.user.id} quantity={workspace.quantity} busy={workspace.busy}
        onStationChange={workspace.setStationId} onMediaChange={workspace.setSelectedMedia}
        onQuantityChange={workspace.setQuantity} onSubmit={workspace.recordCount} />}
    </div>
    <TripsTable trips={workspace.trips} busy={workspace.busy} onCancel={workspace.setCancelTrip} />
    <CancelTripDialog trip={workspace.cancelTrip} busy={workspace.busy}
      onClose={() => { if (!workspace.busy) workspace.setCancelTrip(null); }} onConfirm={workspace.cancelSelectedTrip} />
  </section>;
}
