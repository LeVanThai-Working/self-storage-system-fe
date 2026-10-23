"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { FacilityAmenityTable } from "@/features/facility-amenity-management/components/FacilityAmenityTable";

export default function BusinessOpsFacilityAmenitiesPage() {
  return (
    <BusinessOpsLayout>
      <FacilityAmenityTable />
    </BusinessOpsLayout>
  );
}
