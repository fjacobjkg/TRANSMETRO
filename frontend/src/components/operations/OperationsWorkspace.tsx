import { Notice, PageHeader } from "../ui/PageHeader";

import "../../styles/pages/operations.css";

import {
  useOperationsWorkspace,
} from "../../hooks/operations/useOperationsWorkspace";

import {
  CancelTripDialog,
} from "./CancelTripDialog";

import {
  TripStartForm,
} from "./TripStartForm";

import {
  TripsTable,
} from "./TripsTable";

import {
  VisitForm,
} from "./VisitForm";


export function OperationsWorkspace() {
  const workspace =
    useOperationsWorkspace();

  return (
    <section className="feature-page operations-page">

      <PageHeader
        eyebrow="OPERACIÓN DE ESTACIONES"
        title="Recorridos y registros"
        description="Registra cada recorrido y conserva el orden de estaciones, la demanda y las evaluaciones."
      />


      <Notice
        error={workspace.error}
        message={workspace.message}
      />


      <div className="work-grid">

        <TripStartForm
          lines={workspace.lines}
          trips={workspace.trips}
          line={workspace.line}
          selectedLine={workspace.selectedLine}
          selectedBus={workspace.selectedBus}
          busy={workspace.busy}
          onLineChange={workspace.setSelectedLine}
          onBusChange={workspace.setSelectedBus}
          onSubmit={workspace.startTrip}
        />


        <VisitForm
          trips={workspace.trips}
          selectedTrip={workspace.selectedTrip}
          activeTrip={workspace.activeTrip}
          nextStation={workspace.nextStation}
          peopleOff={workspace.peopleOff}
          peopleBoarding={workspace.peopleBoarding}
          demand={workspace.demand}
          busy={workspace.busy}
          canRecordNext={workspace.canRecordNext}
          onTripChange={workspace.setSelectedTrip}
          onPeopleOffChange={workspace.setPeopleOff}
          onPeopleBoardingChange={workspace.setPeopleBoarding}
          onDemandChange={workspace.setDemand}
          onSubmit={workspace.recordVisit}
        />

      </div>


      <TripsTable
        trips={workspace.trips}
        busy={workspace.busy}
        onCancel={
          workspace.setCancelTrip
        }
      />


      <CancelTripDialog
        trip={workspace.cancelTrip}
        busy={workspace.busy}
        onClose={() => {
          if (!workspace.busy) {
            workspace.setCancelTrip(null);
          }
        }}
        onConfirm={
          workspace.cancelSelectedTrip
        }
      />

    </section>
  );
}