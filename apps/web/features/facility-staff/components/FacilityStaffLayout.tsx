"use client";

import React from "react";
import {
  Boxes,
  Building2,
  CalendarCheck,
  CalendarClock,
  FileSignature,
  Headset,
  Receipt,
  ReceiptText,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useAuthStore } from "@/features/auth/store";
import { useFacility } from "@/features/facility-management/hooks";

interface FacilityStaffLayoutProps {
  children: React.ReactNode;
}

export const FacilityStaffLayout = ({ children }: FacilityStaffLayoutProps) => {
  const locale = useLocale();
  const t = useTranslations("facilityManager");
  const currentUser = useAuthStore((state) => state.currentUser);
  const userRecord = currentUser as unknown as Record<string, unknown> | null;
  const userFacilityId =
    (typeof userRecord?.facilityId === "string" && userRecord.facilityId) ||
    (typeof userRecord?.assignedFacilityId === "string" && userRecord.assignedFacilityId) ||
    ((userRecord?.facility as Record<string, unknown>)?.id as string | undefined);

  const userFacilitySnapshot =
    userRecord?.facility && typeof userRecord.facility === "object"
      ? (userRecord.facility as { name?: string; city?: string })
      : undefined;

  const facilityQuery = useFacility(userFacilityId ?? "", {
    enabled: Boolean(userFacilityId) && !userFacilitySnapshot,
  });

  const facility = userFacilitySnapshot || facilityQuery.data;

  const navItems = [
    {
      href: `/${locale}/facility-staff/reservations`,
      label: t("nav.reservations"),
      icon: CalendarCheck,
    },
    {
      href: `/${locale}/facility-staff/contracts`,
      label: t("nav.contracts"),
      icon: FileSignature,
    },
    {
      href: `/${locale}/facility-staff/storage-units`,
      label: t("nav.storageUnits"),
      icon: Boxes,
    },
    {
      href: `/${locale}/facility-staff/access-schedules`,
      label: t("nav.accessSchedules"),
      icon: CalendarClock,
    },
    {
      href: `/${locale}/facility-staff/incidents`,
      label: t("nav.incidents"),
      icon: TriangleAlert,
    },
    {
      href: `/${locale}/facility-staff/support-tickets`,
      label: t("nav.supportTickets"),
      icon: Headset,
    },
    {
      href: `/${locale}/facility-staff/payments`,
      label: locale === "en" ? "Payments" : "Thanh toán",
      icon: Receipt,
    },
    {
      href: `/${locale}/facility-staff/invoices`,
      label: locale === "en" ? "Invoices & Fees" : "Hóa đơn & Phụ phí",
      icon: ReceiptText,
    },
    {
      href: `/${locale}/facility-staff/refunds`,
      label: locale === "en" ? "Refund Requests" : "Yêu cầu hoàn tiền",
      icon: RotateCcw,
    },
  ];

  const roleLabel = locale === "en" ? "Facility Staff" : "Nhân viên cơ sở";

  return (
    <PortalLayout
      homeHref={`/${locale}/facility-staff/contracts`}
      portalLabel="Staff Workspace"
      roleLabel={roleLabel}
      navSectionLabel={t("nav.sectionFacility")}
      navItems={navItems}
      headerStart={
        <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-bg px-2.5 py-1 text-xs font-bold text-neutral-main">
          <Building2 className="size-3.5 text-brand" />
          {facility?.name ??
            (locale === "en" ? "Staff Workspace" : "Không gian làm việc nhân viên")}
        </span>
      }
    >
      {children}
    </PortalLayout>
  );
};
