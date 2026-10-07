import "../../styles/pages/administrative/transport.css";

import {
  CatalogWorkspace,
} from "../../components/catalog/CatalogWorkspace";


export function AdministrativeTransportPage() {
  return (
    <div className="administrative-page administrative-transport-page">

      <CatalogWorkspace
        section="transport"
        showRefreshAction={false}
        consultationMode
      />

    </div>
  );
}