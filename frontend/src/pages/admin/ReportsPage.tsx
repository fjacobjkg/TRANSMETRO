import "../../styles/pages/admin/reports.css";

import {
  ReportsWorkspace,
} from "../../components/reports/ReportsWorkspace";


export function AdminReportsPage() {
  return (
    <div className="admin-page admin-reports-page">
      <ReportsWorkspace showNetwork={false} paymentSimulation />
    </div>
  );
}
