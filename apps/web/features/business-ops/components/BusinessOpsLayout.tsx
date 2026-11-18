"use client";

import React from "react";
import {
  Building2,
  LayoutDashboard,
  BarChart3,
  Layers,
  Sparkles,
  Tag,
  Package,
  FileCheck2,
  RotateCcw,
  Receipt,
  ReceiptText,
  ArrowLeftRight,
  FileSignature,
  Landmark,
  Clock,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { RagAdvisorChatWidget } from "@/features/statistics";

interface BusinessOpsLayoutProps {
  children: React.ReactNode;
}

export const BusinessOpsLayout = ({ children }: BusinessOpsLayoutProps) => {
  const locale = useLocale();
  const t = useTranslations("businessOps");

  const navItems = [
    {
      href: `/${locale}/business-ops`,
      exact: true,
      label: t("nav.overview"),
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/business-ops/facilities`,
      exact: false,
      label: t("nav.facilities"),
      icon: Building2,
    },
    {
      href: `/${locale}/business-ops/contracts`,
      exact: false,
      label: locale === "en" ? "Contracts" : "Hợp đồng",
      icon: FileSignature,
    },
    {
      href: `/${locale}/business-ops/signing-authorizations`,
      exact: false,
      label: t("nav.signingAuthorizations"),
      icon: FileSignature,
    },
    {
      href: `/${locale}/business-ops/legal-entities`,
      exact: false,
      label: locale === "en" ? "Legal Entities" : "Pháp nhân doanh nghiệp",
      icon: Landmark,
    },
    {
      href: `/${locale}/business-ops/unit-types`,
      exact: false,
      label: t("nav.unitTypes"),
      icon: Layers,
    },
    {
      href: `/${locale}/business-ops/amenities`,
      exact: false,
      label: t("nav.amenities"),
      icon: Sparkles,
    },
    {
      href: `/${locale}/business-ops/offerings`,
      exact: false,
      label: t("nav.offerings"),
      icon: Tag,
    },
    {
      href: `/${locale}/business-ops/facility-amenities`,
      exact: false,
      label: t("nav.facilityAmenities"),
      icon: Package,
    },
    {
      href: `/${locale}/business-ops/time-slots`,
      exact: false,
      label: t("nav.timeSlots"),
      icon: Clock,
    },
    {
      href: `/${locale}/business-ops/approvals`,
      exact: false,
      label: t("nav.approvals"),
      icon: FileCheck2,
    },
    {
      href: `/${locale}/business-ops/payments`,
      exact: false,
      label: locale === "en" ? "Payments" : "Thanh toán",
      icon: Receipt,
    },
    {
      href: `/${locale}/business-ops/invoices`,
      exact: false,
      label: locale === "en" ? "Invoices & Fees" : "Hóa đơn & Phụ phí",
      icon: ReceiptText,
    },
    {
      href: `/${locale}/business-ops/reconciliation`,
      exact: false,
      label: locale === "en" ? "Reconciliation" : "Đối soát ngân hàng",
      icon: ArrowLeftRight,
    },
    {
      href: `/${locale}/business-ops/refunds`,
      exact: false,
      label: locale === "en" ? "Refund Queue" : "Hàng đợi hoàn tiền",
      icon: RotateCcw,
    },
    {
      href: `/${locale}/business-ops/analytics`,
      exact: false,
      label: t("nav.analytics"),
      icon: BarChart3,
    },
  ];

  return (
    <PortalLayout
      homeHref={`/${locale}/business-ops`}
      portalLabel="Ops Portal"
      roleLabel="Business Operations"
      navSectionLabel={t("nav.sectionOperations")}
      navItems={navItems}
      extra={<RagAdvisorChatWidget role="business_ops_manager" />}
    >
      {children}
    </PortalLayout>
  );
};
