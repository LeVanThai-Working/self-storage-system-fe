"use client";

import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { RefundsListView } from "@/features/refund-request";

export default function SystemAdminRefundsPage() {
  return (
    <SystemAdminLayout>
      <RefundsListView
        pageTitle="Quản lý hoàn tiền"
        pageSubtitle="Duyệt yêu cầu hoàn tiền và theo dõi hoàn tiền ở tất cả cơ sở."
      />
    </SystemAdminLayout>
  );
}
