"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { PaymentsListView } from "@/features/payment-management";

export default function BusinessOpsPaymentsPage() {
  return (
    <BusinessOpsLayout>
      <PaymentsListView isManagerOrAdmin />
    </BusinessOpsLayout>
  );
}
