"use client";

import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { IncidentListView } from "@/features/incident-management/components/IncidentListView";

export default function FacilityStaffIncidentsPage() {
  return (
    <FacilityStaffLayout>
      <IncidentListView portalBase="facility-staff" />
    </FacilityStaffLayout>
  );
}
