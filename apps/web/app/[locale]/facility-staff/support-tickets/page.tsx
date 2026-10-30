"use client";

import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { SupportQueueView } from "@/features/support-desk/components/SupportQueueView";

export default function FacilityStaffSupportTicketsPage() {
  return (
    <FacilityStaffLayout>
      <SupportQueueView portalBase="facility-staff" />
    </FacilityStaffLayout>
  );
}
