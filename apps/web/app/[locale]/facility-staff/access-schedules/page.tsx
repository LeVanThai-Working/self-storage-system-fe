"use client";

import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { AccessScheduleListView } from "@/features/access-schedules/components/AccessScheduleListView";

export default function FacilityStaffAccessSchedulesPage() {
  return (
    <FacilityStaffLayout>
      <AccessScheduleListView portalBase="facility-staff" />
    </FacilityStaffLayout>
  );
}
