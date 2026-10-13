"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { ContractsListView } from "@/features/contract-management/components/ContractsListView";

export default function FacilityManagerContractsPage() {
  return (
    <FacilityManagerLayout>
      <ContractsListView portalBase="facility-manager" />
    </FacilityManagerLayout>
  );
}
