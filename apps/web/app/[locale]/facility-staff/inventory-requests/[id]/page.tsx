"use client";

import { use } from "react";
import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { RequestDetailView } from "@/features/inventory-operations/components/RequestDetailView";

export default function FacilityStaffInventoryRequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);

  return (
    <FacilityStaffLayout>
      <RequestDetailView id={id} portalBase="facility-staff" />
    </FacilityStaffLayout>
  );
}
