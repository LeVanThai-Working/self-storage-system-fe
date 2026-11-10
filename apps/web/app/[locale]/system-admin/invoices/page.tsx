"use client";

import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { InvoicesListView } from "@/features/invoice-management";

export default function SystemAdminInvoicesPage() {
  return (
    <SystemAdminLayout>
      <InvoicesListView
        portalBase="system-admin"
        pageTitle="Quản lý hóa đơn"
        pageSubtitle="Theo dõi hóa đơn của tất cả cơ sở, tạo hóa đơn kỳ tới trước hạn 7 ngày, xử lý quá hạn và gửi nhắc nợ."
      />
    </SystemAdminLayout>
  );
}
