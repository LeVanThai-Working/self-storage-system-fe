"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { InvoicesListView } from "@/features/invoice-management";

export default function BusinessOpsInvoicesPage() {
  return (
    <BusinessOpsLayout>
      <InvoicesListView
        portalBase="business-ops"
        pageTitle="Quản lý Hóa đơn & Quét Billing Toàn hệ thống"
        pageSubtitle="Giám sát doanh thu hóa đơn, kích hoạt mẻ quét sinh hóa đơn T-7, quét phạt quá hạn và nhắc nợ đa kênh"
      />
    </BusinessOpsLayout>
  );
}
