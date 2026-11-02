"use client";

import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { LegalEntityListView } from "@/features/legal-entity";

export default function SystemAdminLegalEntitiesPage() {
  return (
    <SystemAdminLayout>
      <LegalEntityListView />
    </SystemAdminLayout>
  );
}
