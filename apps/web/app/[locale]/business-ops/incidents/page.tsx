"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { IncidentListView } from "@/features/incident-management/components/IncidentListView";

export default function BusinessOpsIncidentsPage() {
  return (
    <BusinessOpsLayout>
      <IncidentListView portalBase="business-ops" />
    </BusinessOpsLayout>
  );
}
