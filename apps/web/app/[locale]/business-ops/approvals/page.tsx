"use client";

import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { ApprovalTable } from "@/features/approval-center/components/ApprovalTable";

export default function BusinessOpsApprovalsPage() {
  return (
    <BusinessOpsLayout>
      <ApprovalTable />
    </BusinessOpsLayout>
  );
}
