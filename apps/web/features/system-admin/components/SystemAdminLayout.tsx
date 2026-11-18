"use client";

import React from "react";
import {
  Users,
  LayoutDashboard,
  ScrollText,
  Trash2,
  RotateCcw,
  Receipt,
  ReceiptText,
  ArrowLeftRight,
  FileSignature,
  Landmark,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PortalLayout } from "@/components/layout/PortalLayout";

interface SystemAdminLayoutProps {
  children: React.ReactNode;
}

export const SystemAdminLayout = ({ children }: SystemAdminLayoutProps) => {
  const locale = useLocale();
  const t = useTranslations("systemAdmin");

  const navItems = [
    {
      href: `/${locale}/system-admin`,
      exact: true,
      label: t("nav.overview"),
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/system-admin/users`,
      exact: false,
      label: t("nav.userManagement"),
      icon: Users,
    },
    {
      href: `/${locale}/system-admin/signing-authorizations`,
      exact: false,
      label: t("nav.signingAuthorizations"),
      icon: FileSignature,
    },
    {
      href: `/${locale}/system-admin/contracts`,
      exact: false,
      label: locale === "en" ? "Contracts" : "Hợp đồng",
      icon: FileSignature,
    },
    {
      href: `/${locale}/system-admin/legal-entities`,
      exact: false,
      label: locale === "en" ? "Legal Entities" : "Pháp nhân doanh nghiệp",
      icon: Landmark,
    },
    {
      href: `/${locale}/system-admin/audit-logs`,
      exact: false,
      label: t("nav.auditLogs"),
      icon: ScrollText,
    },
    {
      href: `/${locale}/system-admin/trash`,
      exact: false,
      label: t("nav.trash"),
      icon: Trash2,
    },
    {
      href: `/${locale}/system-admin/payments`,
      exact: false,
      label: locale === "en" ? "Payments" : "Thanh toán",
      icon: Receipt,
    },
    {
      href: `/${locale}/system-admin/invoices`,
      exact: false,
      label: locale === "en" ? "Invoices & Fees" : "Hóa đơn & Phụ phí",
      icon: ReceiptText,
    },
    {
      href: `/${locale}/system-admin/reconciliation`,
      exact: false,
      label: locale === "en" ? "Reconciliation" : "Đối soát ngân hàng",
      icon: ArrowLeftRight,
    },
    {
      href: `/${locale}/system-admin/refunds`,
      exact: false,
      label: locale === "en" ? "Refund Management" : "Quản trị hoàn tiền",
      icon: RotateCcw,
    },
  ];

  return (
    <PortalLayout
      homeHref={`/${locale}/system-admin`}
      portalLabel="Admin Console"
      roleLabel={t("userTable.roles.systemAdmin")}
      navItems={navItems}
    >
      {children}
    </PortalLayout>
  );
};
