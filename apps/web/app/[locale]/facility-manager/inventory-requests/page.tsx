"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { RequestQueueView } from "@/features/inventory-operations/components/RequestQueueView";

export default function FacilityManagerInventoryRequestsPage() {
  return (
    <FacilityManagerLayout>
      <RequestQueueView portalBase="facility-manager" />
    </FacilityManagerLayout>
  );
}
