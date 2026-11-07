"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { StatisticsDashboardView } from "@/features/statistics";

export default function BusinessOpsAnalyticsPage() {
  return (
    <BusinessOpsLayout>
      <StatisticsDashboardView role="business_ops_manager" initialTab="trends" />
    </BusinessOpsLayout>
  );
}
