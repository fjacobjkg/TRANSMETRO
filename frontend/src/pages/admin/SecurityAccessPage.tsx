import { CatalogWorkspace } from "../../components/catalog/CatalogWorkspace";
import { securityAccessView } from "../../config/catalog/administration";
import "../../styles/pages/admin/personnel.css";

export function AdminSecurityAccessPage() {
  return <div className="admin-page admin-personnel-page admin-security-access-page">
    <CatalogWorkspace section="personnel" view={securityAccessView} showRefreshAction={false} />
  </div>;
}
