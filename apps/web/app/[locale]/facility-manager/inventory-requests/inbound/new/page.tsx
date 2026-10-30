"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { InboundCreateView } from "@/features/inventory-operations/components/InboundCreateView";

export default function FacilityManagerInboundCreatePage() {
  return (
    <FacilityManagerLayout>
      <InboundCreateView portalBase="facility-manager" />
    </FacilityManagerLayout>
  );
}
