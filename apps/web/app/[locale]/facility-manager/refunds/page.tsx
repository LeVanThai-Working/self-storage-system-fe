"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { RefundsListView } from "@/features/refund-request";

export default function FacilityManagerRefundsPage() {
  return (
    <FacilityManagerLayout>
      <RefundsListView
        pageTitle="Quản lý Phê duyệt Hoàn tiền Cơ sở"
        pageSubtitle="Duyệt yêu cầu hoàn tiền (<= 10M VND), từ chối và xác nhận chi trả tiền thuộc cơ sở"
      />
    </FacilityManagerLayout>
  );
}
