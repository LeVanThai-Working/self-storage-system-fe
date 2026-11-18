"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { Logo } from "@/components/common/Logo";
import { EditProfileModal } from "@/features/auth/components/EditProfileModal";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { useAuthStore } from "@/features/auth/store";
import { NotificationBell } from "@/features/notification/components/NotificationBell";
import { cn } from "@/lib/utils";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Only active on this exact path (used for portal home links). */
  exact?: boolean;
}

interface PortalLayoutProps {
  children: ReactNode;
  homeHref: string;
  /** Short name of the portal under the logo, e.g. "Ops Portal". */
  portalLabel: string;
  roleLabel: string;
  navItems: PortalNavItem[];
  navSectionLabel?: string;
  /** Left side of the header, e.g. the facility the user belongs to. */
  headerStart?: ReactNode;
  /** Rendered after the page, e.g. a floating widget. */
  extra?: ReactNode;
  contentClassName?: string;
  showNotifications?: boolean;
  profileEditable?: boolean;
}

const getInitials = (name?: string) =>
  (name ?? "")
    .replace(/\(.*?\)/g, "") // seed names carry a "(Kho Q7)" suffix
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SH";

/** Shared shell for every signed-in portal: sticky sidebar, sticky header, brand tokens. */
export function PortalLayout({
  children,
  homeHref,
  portalLabel,
  roleLabel,
  navItems,
  navSectionLabel,
  headerStart,
  extra,
  contentClassName,
  showNotifications = true,
  profileEditable = true,
}: PortalLayoutProps) {
  const pathname = usePathname();
  const currentUser = useAuthStore((s) => s.currentUser);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isActive = (item: PortalNavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || Boolean(pathname?.startsWith(`${item.href}/`));

  const avatar = currentUser?.avatarUrl ? (
    <span className="relative size-10 overflow-hidden rounded-xl ring-2 ring-brand-light">
      <Image
        src={currentUser.avatarUrl}
        alt={currentUser.name || "Avatar"}
        fill
        sizes="40px"
        unoptimized
        className="object-cover"
      />
    </span>
  ) : (
    <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white ring-2 ring-brand-light">
      {getInitials(currentUser?.name)}
    </span>
  );

  const userBlock = (
    <>
      <span className="hidden text-right sm:block">
        <span className="block text-sm font-bold text-neutral-main">
          {currentUser?.name ?? roleLabel}
        </span>
        <span className="block text-xs font-medium text-brand">{roleLabel}</span>
      </span>
      {avatar}
    </>
  );

  return (
    <div className="flex min-h-screen bg-brand-pageBg font-sans text-neutral-main">
      <aside className="sticky top-0 z-10 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-neutral-border bg-white md:flex">
        <div className="border-b border-neutral-border px-6 py-5">
          <Logo href={homeHref} showTagline={false} />
          <span className="mt-2 inline-block rounded-md bg-brand-bg px-2 py-0.5 text-[11px] font-semibold tracking-wider text-brand uppercase">
            {portalLabel}
          </span>
        </div>

        <nav aria-label={portalLabel} className="flex-1 space-y-1 p-4">
          {navSectionLabel && (
            <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-neutral-muted uppercase">
              {navSectionLabel}
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-brand-bg font-semibold text-brand"
                    : "font-medium text-neutral-muted hover:bg-brand-bg hover:text-neutral-main"
                )}
              >
                <Icon
                  className={cn("size-5 shrink-0", active ? "text-brand" : "text-neutral-muted")}
                />
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-neutral-border bg-white/85 px-4 backdrop-blur-md sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="md:hidden">
              <Logo href={homeHref} showTagline={false} size="sm" />
            </div>
            <div className="hidden min-w-0 md:block">{headerStart}</div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <LocaleSwitcher />
            {showNotifications && <NotificationBell />}
            <div className="flex items-center gap-3 border-l border-neutral-border pl-3 sm:pl-4">
              {profileEditable ? (
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="flex cursor-pointer items-center gap-3 text-left transition-opacity hover:opacity-80"
                >
                  {userBlock}
                </button>
              ) : (
                <span className="flex items-center gap-3">{userBlock}</span>
              )}
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Below md the sidebar is hidden, so the same links sit in a bar under the header */}
        <nav
          aria-label={portalLabel}
          className="flex gap-2 overflow-x-auto border-b border-neutral-border bg-white px-4 py-2 md:hidden"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap",
                isActive(item) ? "bg-brand-bg text-brand" : "text-neutral-muted"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className={cn("w-full flex-1 p-4 sm:p-8", contentClassName)}>{children}</main>
        {extra}
      </div>

      {profileEditable && (
        <EditProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      )}
    </div>
  );
}
