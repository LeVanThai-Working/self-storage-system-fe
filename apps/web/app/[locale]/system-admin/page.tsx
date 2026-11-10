"use client";

import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { StatisticsDashboardView } from "@/features/statistics";

export default function SystemAdminRootPage() {
  return (
    <SystemAdminLayout>
      <StatisticsDashboardView role="system_admin" initialTab="overview" title="Tổng quan" />
    </SystemAdminLayout>
  );
}
