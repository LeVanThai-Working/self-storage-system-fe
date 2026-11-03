"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { ContractsListView } from "@/features/contract-management/components/ContractsListView";

export default function BusinessOpsContractsPage() {
  return (
    <BusinessOpsLayout>
      <ContractsListView portalBase="business-ops" />
    </BusinessOpsLayout>
  );
}
