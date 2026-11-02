"use client";

import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { ContractsListView } from "@/features/contract-management/components/ContractsListView";

export default function SystemAdminContractsPage() {
  return (
    <SystemAdminLayout>
      <ContractsListView portalBase="system-admin" />
    </SystemAdminLayout>
  );
}
