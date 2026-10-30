"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { IncidentListView } from "@/features/incident-management/components/IncidentListView";

export default function FacilityManagerIncidentsPage() {
  return (
    <FacilityManagerLayout>
      <IncidentListView portalBase="facility-manager" />
    </FacilityManagerLayout>
  );
}
