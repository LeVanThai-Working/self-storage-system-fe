import React from "react";
import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { FacilityTimeSlotsManager } from "@/features/facility-time-slot";

export default function BusinessOpsTimeSlotsPage() {
  return (
    <BusinessOpsLayout>
      <div className="py-2">
        <FacilityTimeSlotsManager />
      </div>
    </BusinessOpsLayout>
  );
}
