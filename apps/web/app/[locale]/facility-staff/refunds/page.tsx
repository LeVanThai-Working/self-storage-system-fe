"use client";

import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { RefundsListView } from "@/features/refund-request";

export default function FacilityStaffRefundsPage() {
  return (
    <FacilityStaffLayout>
      <RefundsListView
        pageTitle="Quản lý hoàn tiền"
        pageSubtitle="Tạo yêu cầu hoàn tiền và xác nhận đã chuyển tiền cho khách của cơ sở."
      />
    </FacilityStaffLayout>
  );
}
