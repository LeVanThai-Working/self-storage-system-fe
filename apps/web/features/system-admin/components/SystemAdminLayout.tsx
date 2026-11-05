"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Search,
  Users,
  Settings,
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
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { EditProfileModal } from "@/features/auth/components/EditProfileModal";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { useAuthStore } from "@/features/auth/store";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { NotificationBell } from "@/features/notification/components/NotificationBell";

interface SystemAdminLayoutProps {
  children: React.ReactNode;
}

const getInitials = (name?: string) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SA";

export const SystemAdminLayout = ({ children }: SystemAdminLayoutProps) => {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("systemAdmin");
  const currentUser = useAuthStore((state) => state.currentUser);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
    {
      href: `/${locale}/system-admin/settings`,
      exact: false,
      label: t("nav.settings"),
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex-shrink-0 flex flex-col hidden md:flex relative z-10">
        <div className="p-6">
          <div className="text-2xl font-extrabold text-emerald-600 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-lg">S</span>
            </div>
            StorageHub
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-600 font-semibold"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${isActive ? "text-emerald-600" : "text-slate-400"}`}
                />
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 z-10">
          <div className="relative w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("search")}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-6">
            <LocaleSwitcher />
            <NotificationBell />

            <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-3 text-left group hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                    {currentUser?.name ?? "Admin"}
                  </div>
                  <div className="text-xs text-slate-400">System Admin</div>
                </div>
                {currentUser?.avatarUrl ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white ring-2 ring-emerald-50 shadow-sm">
                    <Image
                      src={currentUser.avatarUrl}
                      alt={currentUser.name ?? "Avatar"}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm border-2 border-white ring-2 ring-emerald-50">
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
