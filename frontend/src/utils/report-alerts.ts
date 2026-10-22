// The API summary counts each alert category across the full filtered query.
// A visit with both alerts contributes once to each category.
export function operationAlertCounts(summary: { extraUnitAlerts?: unknown; additionalWaitVisits?: unknown }) {
  const unitAlerts = Number(summary.extraUnitAlerts ?? 0);
  const waitAlerts = Number(summary.additionalWaitVisits ?? 0);
  return { unitAlerts, waitAlerts, total: unitAlerts + waitAlerts };
}
