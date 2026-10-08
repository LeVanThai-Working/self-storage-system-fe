"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { StorageUnitTable } from "@/features/storage-unit-management/components/StorageUnitTable";

export default function FacilityManagerStorageUnitsPage() {
  return (
    <FacilityManagerLayout>
      <StorageUnitTable />
    </FacilityManagerLayout>
  );
}
