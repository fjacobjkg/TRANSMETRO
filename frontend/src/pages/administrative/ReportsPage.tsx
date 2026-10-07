import "../../styles/pages/administrative/reports.css";

import {
  ReportsWorkspace,
} from "../../components/reports/ReportsWorkspace";


export function AdministrativeReportsPage() {
  return (
    <div className="administrative-page administrative-reports-page">
      <ReportsWorkspace />
    </div>
  );
}