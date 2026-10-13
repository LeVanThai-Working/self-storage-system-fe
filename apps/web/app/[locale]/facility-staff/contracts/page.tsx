"use client";

import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { ContractsListView } from "@/features/contract-management/components/ContractsListView";

export default function FacilityStaffContractsPage() {
  return (
    <FacilityStaffLayout>
      <ContractsListView portalBase="facility-staff" />
    </FacilityStaffLayout>
  );
}
