"use client";

import React from "react";
import {
  Bell,
  Search,
  Building2,
  LayoutDashboard,
  BarChart3,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

interface BusinessOpsLayoutProps {
  children: React.ReactNode;
}

export const BusinessOpsLayout = ({ children }: BusinessOpsLayoutProps) => {
  const locale = useLocale();
  const pathname = usePathname();
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
                : pathname === item.href || pathname?.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm shadow-emerald-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Banner */}
        <div className="mt-auto p-4 m-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-orange-500/10 border border-emerald-100/60">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs mb-1">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Mạng lưới toàn quốc</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Quản lý tập trung các chi nhánh kho và chỉ số vận hành real-time.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm shadow-slate-100/50">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="w-full bg-slate-100/80 border-none rounded-full py-2.5 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center gap-5 ml-4">
            <button
              aria-label="Notifications"
              className="relative p-2.5 text-slate-500 hover:text-emerald-600 transition-colors rounded-full hover:bg-slate-50"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-5 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-800">Ops Manager</div>
                <div className="text-xs text-orange-600 font-medium">Business Operations</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 border-2 border-white ring-2 ring-orange-50">
                <span className="text-white font-bold text-sm">OM</span>
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
