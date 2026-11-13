"use client";

import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { StatisticsDashboardView } from "@/features/statistics";
import { CheckInTimeValidationControl } from "@/features/system-admin/components/CheckInTimeValidationControl";

export default function SystemAdminRootPage() {
  return (
    <SystemAdminLayout>
      <CheckInTimeValidationControl />
      <StatisticsDashboardView role="system_admin" initialTab="overview" title="Tổng quan" />
    </SystemAdminLayout>
  );
}
