"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { StatisticsDashboardView } from "@/features/statistics";
import { useMyFacility } from "@/features/storage-unit-management/hooks";

export default function FacilityManagerAnalyticsPage() {
  const { data: facility } = useMyFacility();

  return (
    <FacilityManagerLayout>
      <StatisticsDashboardView
        role="facility_manager"
        lockedFacilityId={facility?.id}
        facilityName={facility?.name}
        initialTab="overview"
      />
    </FacilityManagerLayout>
  );
}
