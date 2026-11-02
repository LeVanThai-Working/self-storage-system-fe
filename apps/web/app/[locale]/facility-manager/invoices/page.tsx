"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { InvoicesListView } from "@/features/invoice-management";

export default function FacilityManagerInvoicesPage() {
  return (
    <FacilityManagerLayout>
      <InvoicesListView
        portalBase="facility-manager"
        pageTitle="Quản lý Hóa đơn & Phụ phí Cơ sở"
        pageSubtitle="Quản lý vòng đời hóa đơn định kỳ, tạo hóa đơn phụ phí và đối soát thu tiền tại cơ sở"
      />
    </FacilityManagerLayout>
  );
}
