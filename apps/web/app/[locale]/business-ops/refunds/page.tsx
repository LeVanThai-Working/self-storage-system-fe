"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { RefundsListView } from "@/features/refund-request";

export default function BusinessOpsRefundsPage() {
  return (
    <BusinessOpsLayout>
      <RefundsListView
        pageTitle="Hàng đợi Phê duyệt & Đối soát Hoàn tiền"
        pageSubtitle="Phê duyệt các yêu cầu hoàn tiền lớn vượt ngưỡng (> 10M VND), giám sát hàng đợi hoàn tiền toàn hệ thống"
      />
    </BusinessOpsLayout>
  );
}
