"use client";

import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { StorageUnitTable } from "@/features/storage-unit-management/components/StorageUnitTable";

export default function FacilityStaffStorageUnitsPage() {
  return (
    <FacilityStaffLayout>
      <StorageUnitTable mode="staff" />
    </FacilityStaffLayout>
  );
}
