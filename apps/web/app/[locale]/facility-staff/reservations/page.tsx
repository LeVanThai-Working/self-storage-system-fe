"use client";

import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { ManagerReservationsView } from "@/features/reservation-management/components/ManagerReservationsView";

export default function FacilityStaffReservationsPage() {
  return (
    <FacilityStaffLayout>
      <ManagerReservationsView portalBase="facility-staff" />
    </FacilityStaffLayout>
  );
}
