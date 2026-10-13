"use client";

import { use } from "react";
import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { ContractDetailView } from "@/features/contract-management/components/ContractDetailView";

export default function FacilityManagerContractDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);

  return (
    <FacilityManagerLayout>
      <ContractDetailView contractId={id} portalBase="facility-manager" />
    </FacilityManagerLayout>
  );
}
