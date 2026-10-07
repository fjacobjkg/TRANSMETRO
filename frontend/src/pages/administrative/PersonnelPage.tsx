import "../../styles/pages/administrative/personnel.css";

import {
  CatalogWorkspace,
} from "../../components/catalog/CatalogWorkspace";


export function AdministrativePersonnelPage() {
  return (
    <div className="administrative-page administrative-personnel-page">

      <CatalogWorkspace
        section="personnel"
        showRefreshAction={false}
        consultationMode
      />

    </div>
  );
}