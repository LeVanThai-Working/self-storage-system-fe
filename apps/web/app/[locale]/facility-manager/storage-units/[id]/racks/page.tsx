"use client";

import { use } from "react";
import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { UnitRacksPage } from "@/features/storage-rack/components/UnitRacksPage";

export default function FacilityManagerUnitRacksPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);

  return (
    <FacilityManagerLayout>
      <UnitRacksPage unitId={id} portalBase="facility-manager" />
    </FacilityManagerLayout>
  );
}
