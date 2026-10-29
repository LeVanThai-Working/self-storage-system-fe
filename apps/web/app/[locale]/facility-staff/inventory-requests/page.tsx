"use client";

import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { RequestQueueView } from "@/features/inventory-operations/components/RequestQueueView";

export default function FacilityStaffInventoryRequestsPage() {
  return (
    <FacilityStaffLayout>
      <RequestQueueView portalBase="facility-staff" />
    </FacilityStaffLayout>
  );
}
