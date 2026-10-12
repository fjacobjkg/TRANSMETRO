import "../../styles/pages/admin/fleet.css";

import {
  CatalogWorkspace,
} from "../../components/catalog/CatalogWorkspace";
import { fleetView } from "../../config/catalog/administration";


export function AdminFleetPage() {
  return (
    <div className="admin-page admin-fleet-page">

      <CatalogWorkspace
        section="fleet"
        showRefreshAction={false}
        view={fleetView}
      />

    </div>
  );
}
