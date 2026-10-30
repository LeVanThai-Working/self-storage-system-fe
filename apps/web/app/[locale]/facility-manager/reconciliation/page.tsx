"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { UnmatchedTransactionsView } from "@/features/payment-management";

export default function FacilityManagerReconciliationPage() {
  return (
    <FacilityManagerLayout>
      <UnmatchedTransactionsView />
    </FacilityManagerLayout>
  );
}
