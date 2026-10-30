"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { PaymentsListView } from "@/features/payment-management";

export default function FacilityManagerPaymentsPage() {
  return (
    <FacilityManagerLayout>
      <PaymentsListView isManagerOrAdmin />
    </FacilityManagerLayout>
  );
}
