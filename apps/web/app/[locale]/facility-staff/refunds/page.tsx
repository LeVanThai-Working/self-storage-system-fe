"use client";

import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { RefundsListView } from "@/features/refund-request";

export default function FacilityStaffRefundsPage() {
  return (
    <FacilityStaffLayout>
      <RefundsListView
        pageTitle="Quản lý Hoàn tiền Cơ sở"
        pageSubtitle="Tạo yêu cầu hoàn tiền (Maker), xem danh sách và xác nhận đã chuyển tiền cho khách hàng thuộc cơ sở"
      />
    </FacilityStaffLayout>
  );
}
