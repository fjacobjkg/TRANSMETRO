import "../../styles/pages/admin/users.css";

import {
  CatalogWorkspace,
} from "../../components/catalog/CatalogWorkspace";


export function AdminUsersPage() {
  return (
    <div className="admin-page admin-users-page">

      <CatalogWorkspace
        section="users"
        showRefreshAction={false}
      />

    </div>
  );
}