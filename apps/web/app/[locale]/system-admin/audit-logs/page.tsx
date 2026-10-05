"use client";

import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { AuditLogTable } from "@/features/audit-logs/components/AuditLogTable";

export default function AuditLogsPage() {
  return (
    <SystemAdminLayout>
      <AuditLogTable />
    </SystemAdminLayout>
  );
}
