"use client";

import { use } from "react";
import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { AccessScheduleDetailView } from "@/features/access-schedules/components/AccessScheduleDetailView";

export default function FacilityStaffAccessScheduleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);

  return (
    <FacilityStaffLayout>
      <AccessScheduleDetailView id={id} portalBase="facility-staff" />
    </FacilityStaffLayout>
  );
}
