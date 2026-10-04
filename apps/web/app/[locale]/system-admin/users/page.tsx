"use client";

import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { UserTable } from "@/features/system-admin/components/UserTable";

export default function UsersPage() {
  return (
    <SystemAdminLayout>
      <UserTable />
    </SystemAdminLayout>
  );
}
