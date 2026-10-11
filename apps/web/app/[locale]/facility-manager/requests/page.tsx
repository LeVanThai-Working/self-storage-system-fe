"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { RequestCenterView } from "@/features/request-center/components/RequestCenterView";

export default function FacilityManagerRequestsPage() {
  return (
    <FacilityManagerLayout>
      <RequestCenterView />
    </FacilityManagerLayout>
  );
}
