import { TripAccessSummary } from "../../components/operations/TripAccessSummary";
import { PageHeader } from "../../components/ui/PageHeader";
import "../../styles/pages/operations.css";
import "../../styles/pages/operator/access-summary.css";

export function OperatorAccessCountsPage() {
  return (
    <section className="feature-page operations-page operator-access-counts-page">
      <PageHeader eyebrow="CONTROL DE ACCESOS" title="Resumen de accesos"
        description="Consulta los accesos estimados y la recaudación de referencia de cada recorrido." />
      <TripAccessSummary />
    </section>
  );
}

