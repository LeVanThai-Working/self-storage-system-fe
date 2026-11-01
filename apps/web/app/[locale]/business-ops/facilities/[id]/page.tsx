"use client";

import { use } from "react";
import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { FacilityStorageUnitsView } from "@/features/facility-management/components/FacilityStorageUnitsView";

export default function BusinessOpsFacilityStorageUnitsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);

  return (
    <BusinessOpsLayout>
      <FacilityStorageUnitsView facilityId={id} />
    </BusinessOpsLayout>
  );
}
