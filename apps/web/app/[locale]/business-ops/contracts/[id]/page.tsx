"use client";

import { use } from "react";
import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { ContractDetailView } from "@/features/contract-management/components/ContractDetailView";

export default function BusinessOpsContractDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);

  return (
    <BusinessOpsLayout>
      <ContractDetailView contractId={id} portalBase="business-ops" />
    </BusinessOpsLayout>
  );
}
