"use client";

import { FacilityManagerLayout } from "@/features/facility-manager/components/FacilityManagerLayout";
import { SigningAuthorizationListView } from "@/features/signing-authorization/components/SigningAuthorizationListView";

export default function FacilityManagerSigningAuthorizationsPage() {
  return (
    <FacilityManagerLayout>
      <SigningAuthorizationListView portalBase="facility-manager" />
    </FacilityManagerLayout>
  );
}
