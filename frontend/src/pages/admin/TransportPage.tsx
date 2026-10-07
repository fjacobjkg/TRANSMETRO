import "../../styles/pages/admin/transport.css";

import {
  CatalogWorkspace,
} from "../../components/catalog/CatalogWorkspace";


export function AdminTransportPage() {
  return (
    <div className="admin-page admin-transport-page">

      <CatalogWorkspace
        section="transport"
        showRefreshAction={false}
      />

    </div>
  );
}