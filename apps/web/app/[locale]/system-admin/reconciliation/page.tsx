"use client";

import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { UnmatchedTransactionsView } from "@/features/payment-management";

export default function SystemAdminReconciliationPage() {
  return (
    <SystemAdminLayout>
      <UnmatchedTransactionsView />
    </SystemAdminLayout>
  );
}
