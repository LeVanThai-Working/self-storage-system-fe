"use client";

import React from "react";
import {
  Search,
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
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { useAuthStore } from "@/features/auth/store";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { NotificationBell } from "@/features/notification/components/NotificationBell";
import { RagAdvisorChatWidget } from "@/features/statistics";

interface BusinessOpsLayoutProps {
  children: React.ReactNode;
}

const getInitials = (name?: string) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "OM";

export const BusinessOpsLayout = ({ children }: BusinessOpsLayoutProps) => {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("businessOps");
  const currentUser = useAuthStore((state) => state.currentUser);

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
    <div className="min-h-screen bg-slate-50/70 font-sans flex text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex-shrink-0 flex flex-col hidden md:flex relative z-10 shadow-sm">
        <div className="p-6 border-b border-slate-50">
          <Link href={`/${locale}/business-ops`} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-tight">
                Storage<span className="text-emerald-600">Hub</span>
              </span>
              <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider block">
                Ops Portal
              </span>
            </div>
          </Link>
        </div>

        <div className="px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            {t("nav.sectionOperations")}
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? "text-emerald-600 scale-110" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate whitespace-nowrap">{item.label}</span>
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
          <div className="relative w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-5">
            <LocaleSwitcher />
            <NotificationBell />

            <div className="flex items-center gap-3 pl-5 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-800">
                  {currentUser?.name ?? "Ops Manager"}
                </div>
                <div className="text-xs text-orange-600 font-medium">Business Operations</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 border-2 border-white ring-2 ring-orange-50">
                <span className="text-white font-bold text-sm">
                  {getInitials(currentUser?.name)}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>

        {/* Floating AI RAG Profit Advisor Widget for Business Operations Manager */}
        <RagAdvisorChatWidget role="business_ops_manager" />
      </div>
    </div>
  );
};
