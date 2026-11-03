"use client";

import { use } from "react";
import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { ContractDetailView } from "@/features/contract-management/components/ContractDetailView";

export default function SystemAdminContractDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);

  return (
    <SystemAdminLayout>
      <ContractDetailView contractId={id} portalBase="system-admin" />
    </SystemAdminLayout>
  );
}
