"use client";

import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { InvoicesListView } from "@/features/invoice-management";

export default function FacilityStaffInvoicesPage() {
  return (
    <FacilityStaffLayout>
      <InvoicesListView
        portalBase="facility-staff"
        pageTitle="Quản lý hóa đơn"
        pageSubtitle="Tra cứu hóa đơn của cơ sở, lấy mã VietQR và xác nhận thu tiền tại quầy."
      />
    </FacilityStaffLayout>
  );
}
