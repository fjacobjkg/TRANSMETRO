import "../../styles/pages/admin/personnel.css";
import { personnelView } from "../../config/catalog/administration";

import {
  CatalogWorkspace,
} from "../../components/catalog/CatalogWorkspace";


export function AdminPersonnelPage() {
  return (
    <div className="admin-page admin-personnel-page">

      <CatalogWorkspace
        section="personnel"
        view={personnelView}
        showRefreshAction={false}
      />

    </div>
  );
}
