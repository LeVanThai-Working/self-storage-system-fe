"use client";

import { use } from "react";
import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { AccessScheduleDetailView } from "@/features/access-schedules/components/AccessScheduleDetailView";

export default function FacilityManagerAccessScheduleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);

  return (
    <FacilityManagerLayout>
      <AccessScheduleDetailView id={id} portalBase="facility-manager" />
    </FacilityManagerLayout>
  );
}
