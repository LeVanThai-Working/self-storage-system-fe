"use client";

import { use } from "react";
import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { IncidentDetailView } from "@/features/incident-management/components/IncidentDetailView";

export default function BusinessOpsIncidentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);
  return (
    <BusinessOpsLayout>
      <IncidentDetailView id={id} portalBase="business-ops" />
    </BusinessOpsLayout>
  );
}
