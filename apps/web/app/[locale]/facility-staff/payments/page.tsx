"use client";

import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { PaymentsListView } from "@/features/payment-management";

export default function FacilityStaffPaymentsPage() {
  return (
    <FacilityStaffLayout>
      <PaymentsListView />
    </FacilityStaffLayout>
  );
}
