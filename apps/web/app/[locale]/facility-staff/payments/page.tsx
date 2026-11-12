"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { PaymentsListView } from "@/features/payment-management";
import { useMyFacility } from "@/features/storage-unit-management/hooks";

export default function FacilityStaffPaymentsPage() {
  const facilityQuery = useMyFacility();
  const facilityId = facilityQuery.data?.id;

  return (
    <FacilityStaffLayout>
      {/* Mount only once the facility is known: the list keeps its first facilityId as filter state */}
      {facilityId ? (
        <PaymentsListView initialFacilityId={facilityId} />
      ) : facilityQuery.isLoading ? (
        <Skeleton className="h-96 w-full rounded-3xl" />
      ) : (
        <p className="text-sm text-slate-500">Chưa xác định được cơ sở phụ trách.</p>
      )}
    </FacilityStaffLayout>
  );
}
