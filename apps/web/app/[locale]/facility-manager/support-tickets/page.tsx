"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { SupportQueueView } from "@/features/support-desk/components/SupportQueueView";

export default function FacilityManagerSupportTicketsPage() {
  return (
    <FacilityManagerLayout>
      <SupportQueueView portalBase="facility-manager" />
    </FacilityManagerLayout>
  );
}
