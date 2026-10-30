import React from "react";
import { View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { RefundRequestStatusEnum } from "@self-storage-system-fe/shared";
import { useTranslation } from "@/stores/language.store";

interface RefundStatusBadgeProps {
  status: RefundRequestStatusEnum | string;
}

export const RefundStatusBadge: React.FC<RefundStatusBadgeProps> = ({ status }) => {
  const { locale } = useTranslation();
  const isEn = locale === "en";

  switch (status) {
    case RefundRequestStatusEnum.PENDING_APPROVAL:
    case "pending_approval":
      return <Badge variant="warning">{isEn ? "Pending Approval" : "Chờ duyệt"}</Badge>;
    case RefundRequestStatusEnum.APPROVED:
    case "approved":
      return <Badge variant="info">{isEn ? "Approved" : "Đã duyệt"}</Badge>;
    case RefundRequestStatusEnum.PAID:
    case "paid":
      return <Badge variant="success">{isEn ? "Paid" : "Đã hoàn tiền"}</Badge>;
    case RefundRequestStatusEnum.REJECTED:
    case "rejected":
      return <Badge variant="destructive">{isEn ? "Rejected" : "Đã từ chối"}</Badge>;
    case RefundRequestStatusEnum.CANCELLED:
    case "cancelled":
      return <Badge variant="secondary">{isEn ? "Cancelled" : "Đã hủy"}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
