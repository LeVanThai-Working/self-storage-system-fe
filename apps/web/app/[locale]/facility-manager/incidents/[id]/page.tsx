"use client";

import { use } from "react";
import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { IncidentDetailView } from "@/features/incident-management/components/IncidentDetailView";

export default function FacilityManagerIncidentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);

  return (
    <FacilityManagerLayout>
      <IncidentDetailView id={id} portalBase="facility-manager" />
    </FacilityManagerLayout>
  );
}
