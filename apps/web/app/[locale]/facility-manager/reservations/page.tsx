"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { ManagerReservationsView } from "@/features/reservation-management/components/ManagerReservationsView";

export default function FacilityManagerReservationsPage() {
  return (
    <FacilityManagerLayout>
      <ManagerReservationsView />
    </FacilityManagerLayout>
  );
}
