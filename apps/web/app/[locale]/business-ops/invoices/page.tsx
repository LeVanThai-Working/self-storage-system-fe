"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { InvoicesListView } from "@/features/invoice-management";

export default function BusinessOpsInvoicesPage() {
  return (
    <BusinessOpsLayout>
      <InvoicesListView
        portalBase="business-ops"
        pageTitle="Quản lý hóa đơn"
        pageSubtitle="Theo dõi hóa đơn của tất cả cơ sở, tạo hóa đơn kỳ tới trước hạn 7 ngày, xử lý quá hạn và gửi nhắc nợ."
      />
    </BusinessOpsLayout>
  );
}
