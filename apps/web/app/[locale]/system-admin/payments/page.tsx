"use client";

import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { PaymentsListView } from "@/features/payment-management";

export default function SystemAdminPaymentsPage() {
  return (
    <SystemAdminLayout>
      <PaymentsListView isManagerOrAdmin />
    </SystemAdminLayout>
  );
}
