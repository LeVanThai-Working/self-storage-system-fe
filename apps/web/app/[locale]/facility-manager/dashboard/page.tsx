"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { FacilityDashboardView } from "@/features/facility-dashboard/components/FacilityDashboardView";

export default function FacilityManagerDashboardPage() {
  return (
    <FacilityManagerLayout>
      <FacilityDashboardView />
    </FacilityManagerLayout>
  );
}
