"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { OfferingTable } from "@/features/offering-management/components/OfferingTable";

export default function BusinessOpsOfferingsPage() {
  return (
    <BusinessOpsLayout>
      <OfferingTable />
    </BusinessOpsLayout>
  );
}
