"use client";

import { use } from "react";
import { FacilityStaffLayout } from "@/features/facility-staff/components/FacilityStaffLayout";
import { UnitRacksPage } from "@/features/storage-rack/components/UnitRacksPage";

export default function FacilityStaffUnitRacksPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);

  return (
    <FacilityStaffLayout>
      <UnitRacksPage unitId={id} portalBase="facility-staff" />
    </FacilityStaffLayout>
  );
}
