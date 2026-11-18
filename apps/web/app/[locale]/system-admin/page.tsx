"use client";

import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { StatisticsDashboardView } from "@/features/statistics";
import { CheckInTimeValidationControl } from "@/features/system-admin/components/CheckInTimeValidationControl";
import { CheckInDateValidationControl } from "@/features/system-admin/components/CheckInDateValidationControl";

export default function SystemAdminRootPage() {
  return (
    <SystemAdminLayout>
      <CheckInTimeValidationControl />
      <CheckInDateValidationControl variant="card" />
      <StatisticsDashboardView role="system_admin" initialTab="overview" title="Tổng quan" />
    </SystemAdminLayout>
  );
}
