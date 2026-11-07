"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { StatisticsDashboardView } from "@/features/statistics";

export default function BusinessOpsRootPage() {
  return (
    <BusinessOpsLayout>
      <StatisticsDashboardView role="business_ops_manager" initialTab="overview" />
    </BusinessOpsLayout>
  );
}
