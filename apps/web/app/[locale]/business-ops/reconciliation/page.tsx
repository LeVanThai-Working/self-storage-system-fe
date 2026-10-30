"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { UnmatchedTransactionsView } from "@/features/payment-management";

export default function BusinessOpsReconciliationPage() {
  return (
    <BusinessOpsLayout>
      <UnmatchedTransactionsView />
    </BusinessOpsLayout>
  );
}
