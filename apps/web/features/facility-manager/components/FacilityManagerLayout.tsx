"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Boxes,
  Building2,
  CalendarCheck,
  ClipboardList,
  FileSignature,
  FileText,
  Headset,
  LayoutDashboard,
  Receipt,
  ReceiptText,
  RotateCcw,
  TriangleAlert,
  ArrowLeftRight,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { EditProfileModal } from "@/features/auth/components/EditProfileModal";
import { useAuthStore } from "@/features/auth/store";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { NotificationBell } from "@/features/notification/components/NotificationBell";
import { useMyFacility } from "@/features/storage-unit-management/hooks";

interface FacilityManagerLayoutProps {
  children: React.ReactNode;
}

const getInitials = (name?: string) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "FM";

export const FacilityManagerLayout = ({ children }: FacilityManagerLayoutProps) => {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("facilityManager");
  const currentUser = useAuthStore((state) => state.currentUser);
  const { data: facility } = useMyFacility();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navItems = [
    {
      href: `/${locale}/facility-manager/dashboard`,
      label: t("nav.dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/facility-manager/analytics`,
      label: locale === "en" ? "Analytics & Reports" : "Báo cáo & Thống kê",
      icon: BarChart3,
    },
    {
      href: `/${locale}/facility-manager/reservations`,
      label: t("nav.reservations"),
      icon: CalendarCheck,
    },
    {
      href: `/${locale}/facility-manager/contracts`,
      label: t("nav.contracts"),
      icon: FileSignature,
    },
    {
      href: `/${locale}/facility-manager/signing-authorizations`,
      label: t("nav.signingAuthorizations"),
      icon: FileSignature,
    },
    {
      href: `/${locale}/facility-manager/storage-units`,
      label: t("nav.storageUnits"),
      icon: Boxes,
    },
    {
      href: `/${locale}/facility-manager/inventory-requests`,
      label: t("nav.inventoryRequests"),
      icon: ClipboardList,
    },
    {
      href: `/${locale}/facility-manager/incidents`,
      label: t("nav.incidents"),
      icon: TriangleAlert,
    },
    {
      href: `/${locale}/facility-manager/support-tickets`,
      label: t("nav.supportTickets"),
      icon: Headset,
    },
    {
      href: `/${locale}/facility-manager/requests`,
      label: t("nav.requests"),
      icon: FileText,
    },
    {
      href: `/${locale}/facility-manager/payments`,
      label: locale === "en" ? "Payments" : "Thanh toán",
      icon: Receipt,
    },
    {
      href: `/${locale}/facility-manager/invoices`,
      label: locale === "en" ? "Invoices & Fees" : "Hóa đơn & Phụ phí",
      icon: ReceiptText,
    },
    {
      href: `/${locale}/facility-manager/reconciliation`,
      label: locale === "en" ? "Reconciliation" : "Đối soát ngân hàng",
      icon: ArrowLeftRight,
    },
    {
      href: `/${locale}/facility-manager/refunds`,
      label: locale === "en" ? "Refund Approvals" : "Phê duyệt hoàn tiền",
      icon: RotateCcw,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans flex text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex-shrink-0 flex flex-col hidden md:flex relative z-10 shadow-sm">
        <div className="p-6 border-b border-slate-50">
          <Link
            href={`/${locale}/facility-manager/dashboard`}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-tight">
                Storage<span className="text-emerald-600">Hub</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
                Facility Portal
              </span>
            </div>
          </Link>
        </div>

        <div className="px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            {t("nav.sectionFacility")}
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform ${
                      isActive ? "text-emerald-600 scale-110" : "text-slate-400"
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 z-10 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">{t("roleLabel")}:</span>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              {facility?.name || "Chi nhánh"}
            </span>
          </div>

          <div className="flex items-center gap-5">
            <LocaleSwitcher />
            <NotificationBell />

            <div className="flex items-center gap-3 pl-5 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-3 text-left group hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                    {currentUser?.name || "Facility Manager"}
                  </div>
                  <div className="text-xs text-emerald-600 font-medium">Facility Manager</div>
                </div>
                {currentUser?.avatarUrl ? (
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-white ring-2 ring-emerald-50 shadow-md shadow-emerald-500/20">
                    <Image
                      src={currentUser.avatarUrl}
                      alt={currentUser.name || "Avatar"}
                      fill
                      sizes="40px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 border-2 border-white ring-2 ring-orange-50">
                    <span className="text-white font-bold text-sm">
                      {getInitials(currentUser?.name)}
                    </span>
                  </div>
                )}
              </button>
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>

        {/* Profile Modal */}
        <EditProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      </div>
    </div>
  );
};
