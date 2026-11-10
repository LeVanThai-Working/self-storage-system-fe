"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { AccessScheduleListView } from "@/features/access-schedules/components/AccessScheduleListView";

export default function FacilityManagerAccessSchedulesPage() {
  return (
    <FacilityManagerLayout>
      <AccessScheduleListView portalBase="facility-manager" />
    </FacilityManagerLayout>
  );
}
