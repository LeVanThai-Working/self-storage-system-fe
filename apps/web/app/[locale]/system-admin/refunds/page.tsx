"use client";

import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { RefundsListView } from "@/features/refund-request";

export default function SystemAdminRefundsPage() {
  return (
    <SystemAdminLayout>
      <RefundsListView
        pageTitle="Quản trị Hoàn tiền Toàn hệ thống"
        pageSubtitle="Toàn quyền kiểm soát, phê duyệt và giám sát luồng tiền hoàn trên toàn hệ thống"
      />
    </SystemAdminLayout>
  );
}
