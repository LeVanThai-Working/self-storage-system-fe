"use client";

import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { SigningAuthorizationListView } from "@/features/signing-authorization/components/SigningAuthorizationListView";

export default function SystemAdminSigningAuthorizationsPage() {
  return (
    <SystemAdminLayout>
      <SigningAuthorizationListView portalBase="system-admin" />
    </SystemAdminLayout>
  );
}
