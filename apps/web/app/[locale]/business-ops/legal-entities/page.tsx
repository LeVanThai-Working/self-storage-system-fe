"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { LegalEntityListView } from "@/features/legal-entity";

export default function BusinessOpsLegalEntitiesPage() {
  return (
    <BusinessOpsLayout>
      <LegalEntityListView />
    </BusinessOpsLayout>
  );
}
