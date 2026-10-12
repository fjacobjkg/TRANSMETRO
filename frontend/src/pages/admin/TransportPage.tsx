import "../../styles/pages/admin/transport.css";

import {
  CatalogWorkspace,
} from "../../components/catalog/CatalogWorkspace";
import { transportView, transportLineViewTab } from "../../config/catalog/transport";
import { TransportLineView } from "../../components/catalog/TransportLineView";


export function AdminTransportPage() {
  return (
    <div className="admin-page admin-transport-page">

      <CatalogWorkspace
        section="transport"
        showRefreshAction={false}
        view={transportView}
        extraTabs={[{ ...transportLineViewTab, content: <TransportLineView /> }]}
      />

    </div>
  );
}
