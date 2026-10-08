"use client";

import React from "react";
import { Bell, Search, Users, Settings, Home, LayoutDashboard, ScrollText } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

interface SystemAdminLayoutProps {
  children: React.ReactNode;
}

export const SystemAdminLayout = ({ children }: SystemAdminLayoutProps) => {
  const locale = useLocale();
  const pathname = usePathname();
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
      href: `/${locale}/system-admin/audit-logs`,
      exact: false,
      label: t("nav.auditLogs"),
      icon: ScrollText,
    },
    {
      href: `/${locale}/system-admin/facilities`,
      exact: false,
      label: t("nav.facilityManagement"),
      icon: Home,
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
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-600 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 font-medium"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t("search")}
                className="w-full bg-slate-100 border-none rounded-full py-2.5 pl-12 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 ml-4">
            <button className="relative p-2 text-slate-400 hover:text-emerald-600 transition-colors rounded-full hover:bg-slate-50">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full border border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-800">Admin User</div>
                <div className="text-xs text-slate-500 font-medium">System Admin</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm cursor-pointer border-2 border-white ring-2 ring-emerald-50">
                <span className="text-white font-bold text-sm">AU</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
