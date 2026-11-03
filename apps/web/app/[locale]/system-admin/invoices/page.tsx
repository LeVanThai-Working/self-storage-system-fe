"use client";

import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { InvoicesListView } from "@/features/invoice-management";

export default function SystemAdminInvoicesPage() {
  return (
    <SystemAdminLayout>
      <InvoicesListView
        portalBase="system-admin"
        pageTitle="Quản trị Hóa đơn & Hệ thống Billing"
        pageSubtitle="Toàn quyền quản trị, theo dõi chu kỳ hóa đơn và kích hoạt các job quét tự động"
      />
    </SystemAdminLayout>
  );
}
