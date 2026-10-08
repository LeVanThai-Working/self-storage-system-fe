"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { FacilityTable } from "@/features/facility-management/components/FacilityTable";

export default function BusinessOpsFacilitiesPage() {
  return (
    <BusinessOpsLayout>
      <FacilityTable />
    </BusinessOpsLayout>
  );
}
