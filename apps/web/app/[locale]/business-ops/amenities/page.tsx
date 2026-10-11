"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { AmenityTable } from "@/features/amenity-management/components/AmenityTable";

export default function BusinessOpsAmenitiesPage() {
  return (
    <BusinessOpsLayout>
      <AmenityTable />
    </BusinessOpsLayout>
  );
}
