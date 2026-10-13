"use client";

import { use } from "react";
import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { ContractDetailView } from "@/features/contract-management/components/ContractDetailView";

export default function FacilityStaffContractDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);

  return (
    <FacilityStaffLayout>
      <ContractDetailView contractId={id} portalBase="facility-staff" />
    </FacilityStaffLayout>
  );
}
