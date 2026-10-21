"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Building2, Search } from "lucide-react";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { Logo } from "@/components/common/Logo";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { useAuthStore } from "@/features/auth/store";
import { cn } from "@/lib/utils";

const getInitials = (name?: string) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "C";

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("customer");
  const locale = useLocale();
  const pathname = usePathname();
  const currentUser = useAuthStore((s) => s.currentUser);

  const navItems = [
    { href: `/${locale}/customer/facilities`, label: t("nav.facilities"), icon: Building2 },
    { href: `/${locale}/customer/search`, label: t("nav.search"), icon: Search },
  ];
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen bg-brand-pageBg text-neutral-main">
      <aside className="relative z-10 hidden w-64 shrink-0 flex-col border-r border-neutral-border bg-white shadow-sm md:flex">
        <div className="border-b border-neutral-border p-6">
          <Logo href={`/${locale}/customer`} />
        </div>
        <nav aria-label={t("nav.label")} className="space-y-1.5 p-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                isActive(href)
                  ? "bg-brand-bg font-semibold text-brand"
                  : "font-medium text-neutral-muted hover:bg-brand-bg hover:text-neutral-main"
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-4 border-b border-neutral-border bg-white/80 px-4 backdrop-blur-md sm:px-8">
          <div className="md:hidden">
            <Logo href={`/${locale}/customer`} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <LocaleSwitcher />
            <div className="hidden text-right sm:block">
              <div className="text-sm font-bold">{currentUser?.name ?? t("roleLabel")}</div>
              <div className="text-xs font-medium text-brand">{t("roleLabel")}</div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
              {getInitials(currentUser?.name)}
            </div>
            <LogoutButton />
          </div>
        </header>

        {/* Below md the sidebar is hidden, so the same links sit in a bar under the header */}
        <nav
          aria-label={t("nav.label")}
          className="flex gap-2 overflow-x-auto border-b border-neutral-border bg-white px-4 py-2 md:hidden"
        >
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap",
                isActive(href) ? "bg-brand-bg text-brand" : "text-neutral-muted"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-[1280px] flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
