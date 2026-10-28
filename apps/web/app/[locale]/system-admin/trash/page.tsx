"use client";

import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { TrashCenter } from "@/features/trash/components/TrashCenter";

export default function TrashPage() {
  return (
    <SystemAdminLayout>
      <TrashCenter />
    </SystemAdminLayout>
  );
}
