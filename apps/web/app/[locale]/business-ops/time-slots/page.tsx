import React from "react";
import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { FacilityTimeSlotsManager } from "@/features/facility-time-slot";

export const metadata = {
  title: "Cấu hình Khung giờ Làm việc & Tiếp đón | Ops Manager",
  description: "Thiết lập khung giờ nhận khách check-in/check-out theo ngày trong tuần",
};

export default function BusinessOpsTimeSlotsPage() {
  return (
    <BusinessOpsLayout>
      <div className="py-2">
        <FacilityTimeSlotsManager />
      </div>
    </BusinessOpsLayout>
  );
}
