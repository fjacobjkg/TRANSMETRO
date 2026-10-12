import { Notice, PageHeader } from "../ui/PageHeader";
import { useState } from "react";
import { CatalogResourceTabs } from "../catalog/CatalogResourceTabs";

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
  const [selectedSection, setSelectedSection] = useState("start");
  const operatorView = workspace.user?.role === "OPERADOR_ESTACION";
  const sections = [
    { key: "start", title: "Iniciar recorrido" },
    { key: "visit", title: "Registrar visita" },
    { key: "history", title: "Historial" },
  ];

  return (
    <section className="feature-page operations-page">

      <PageHeader
        eyebrow="OPERACIÓN DE ESTACIONES"
        title="Recorridos y registros"
        description={operatorView ? "Gestiona los recorridos activos y registra las visitas realizadas en cada estación."
          : "Registra cada recorrido y conserva el orden de estaciones, la demanda y las evaluaciones."}
      />

      {operatorView && <CatalogResourceTabs resources={sections} selected={selectedSection} onSelect={setSelectedSection}
        label="Secciones de recorridos" panelId="operator-operations-panel" idPrefix="operator-operations-tab" />}


      <Notice
        error={workspace.error}
        message={workspace.message}
      />


      <div className={operatorView ? "operation-section" : "work-grid"}
        id={operatorView ? "operator-operations-panel" : undefined}
        role={operatorView ? "tabpanel" : undefined}
        aria-labelledby={operatorView ? `operator-operations-tab-${selectedSection}` : undefined}>

        {(!operatorView || selectedSection === "start") && <TripStartForm
          lines={workspace.lines}
          trips={workspace.trips}
          line={workspace.line}
          selectedLine={workspace.selectedLine}
          selectedBus={workspace.selectedBus}
          busy={workspace.busy}
          onLineChange={workspace.setSelectedLine}
          onBusChange={workspace.setSelectedBus}
          onSubmit={workspace.startTrip}
        />}


        {(!operatorView || selectedSection === "visit") && <VisitForm
          separateEvaluation={operatorView}
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
        />}

        {operatorView && selectedSection === "history" && <TripsTable trips={workspace.trips} busy={workspace.busy} onCancel={workspace.setCancelTrip} />}

      </div>


      {!operatorView && <TripsTable
        trips={workspace.trips}
        busy={workspace.busy}
        onCancel={
          workspace.setCancelTrip
        }
      />}


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
