"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { UnitTypeTable } from "@/features/unit-type-management/components/UnitTypeTable";

export default function BusinessOpsUnitTypesPage() {
  return (
    <BusinessOpsLayout>
      <UnitTypeTable />
    </BusinessOpsLayout>
  );
}
