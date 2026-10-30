"use client";

import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { InboundCreateView } from "@/features/inventory-operations/components/InboundCreateView";

export default function FacilityStaffInboundCreatePage() {
  return (
    <FacilityStaffLayout>
      <InboundCreateView portalBase="facility-staff" />
    </FacilityStaffLayout>
  );
}
