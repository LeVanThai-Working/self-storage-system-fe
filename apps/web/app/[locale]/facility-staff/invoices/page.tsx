"use client";

import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { InvoicesListView } from "@/features/invoice-management";

export default function FacilityStaffInvoicesPage() {
  return (
    <FacilityStaffLayout>
      <InvoicesListView
        portalBase="facility-staff"
        pageTitle="Tra cứu Hóa đơn & Thu quầy"
        pageSubtitle="Tra cứu hóa đơn thuộc cơ sở phân công, lấy mã SePay VietQR và xác nhận thu tiền mặt tại quầy"
      />
    </FacilityStaffLayout>
  );
}
