"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { RefundsListView } from "@/features/refund-request";

export default function BusinessOpsRefundsPage() {
  return (
    <BusinessOpsLayout>
      <RefundsListView
        pageTitle="Hàng đợi Phê duyệt & Đối soát Hoàn tiền"
        pageSubtitle="Duyệt yêu cầu hoàn tiền trên 10 triệu đồng và theo dõi hoàn tiền ở tất cả cơ sở."
      />
    </BusinessOpsLayout>
  );
}
