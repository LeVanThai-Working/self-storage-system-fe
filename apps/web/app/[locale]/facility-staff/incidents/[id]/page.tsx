"use client";

import { use } from "react";
import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { IncidentDetailView } from "@/features/incident-management/components/IncidentDetailView";

export default function FacilityStaffIncidentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);

  return (
    <FacilityStaffLayout>
      <IncidentDetailView id={id} portalBase="facility-staff" />
    </FacilityStaffLayout>
  );
}
