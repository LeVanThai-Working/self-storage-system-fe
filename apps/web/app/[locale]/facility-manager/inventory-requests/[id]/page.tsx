"use client";

import { use } from "react";
import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { RequestDetailView } from "@/features/inventory-operations/components/RequestDetailView";

export default function FacilityManagerInventoryRequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);

  return (
    <FacilityManagerLayout>
      <RequestDetailView id={id} portalBase="facility-manager" />
    </FacilityManagerLayout>
  );
}
