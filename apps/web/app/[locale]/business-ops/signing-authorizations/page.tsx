"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { SigningAuthorizationListView } from "@/features/signing-authorization/components/SigningAuthorizationListView";

export default function BusinessOpsSigningAuthorizationsPage() {
  return (
    <BusinessOpsLayout>
      <SigningAuthorizationListView portalBase="business-ops" />
    </BusinessOpsLayout>
  );
}
