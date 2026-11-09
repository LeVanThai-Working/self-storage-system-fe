"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { RefundsListView } from "@/features/refund-request";

export default function FacilityManagerRefundsPage() {
  return (
    <FacilityManagerLayout>
      <RefundsListView
        pageTitle="Quản lý Phê duyệt Hoàn tiền Cơ sở"
        pageSubtitle="Duyệt và chi trả yêu cầu hoàn tiền đến 10 triệu đồng tại cơ sở"
      />
    </FacilityManagerLayout>
  );
}
