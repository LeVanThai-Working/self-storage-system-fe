"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Menu, Search, UserRound, X } from "lucide-react";
import { LocaleSwitcher } from "@/components/common/locale-switcher";
import { Logo } from "@/components/common/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, SEARCH_PANEL_ID } from "@/features/landing/constants";

export function LandingHeader() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSearchPanel = () => {
    setMobileMenuOpen(false);
    document
      .getElementById(SEARCH_PANEL_ID)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const iconButtonClass =
    "inline-flex items-center justify-center rounded-xl text-neutral-main transition-colors hover:bg-brand-bg hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-border/70 bg-brand-pageBg/95 backdrop-blur-md transition-all duration-200">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <div className="shrink-0">
          <Logo href={`/${locale}`} taglineClassName="max-[374px]:hidden" />
        </div>

        {/* xl+: text links. lg–xl: icon links (labels kept for tooltips/screen readers). Below lg: drawer */}
        <nav
          aria-label={t("header.mainNav")}
          className="hidden items-center gap-1 lg:flex xl:gap-8"
        >
          {NAV_ITEMS.map(({ id, href, icon: Icon }) => {
            const isActive = id === "home";
            const label = t(`nav.${id}`);
            return (
              <a
                key={id}
                href={href}
                title={label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center justify-center text-sm font-medium whitespace-nowrap transition-colors duration-200 select-none max-xl:size-10 max-xl:rounded-xl max-xl:hover:bg-brand-bg xl:py-2",
                  isActive
                    ? "font-semibold text-neutral-main"
                    : "text-neutral-muted hover:text-neutral-main"
                )}
              >
                <Icon className="size-5 xl:hidden" aria-hidden />
                <span className="max-xl:sr-only">{label}</span>
                {isActive && (
                  <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-cta max-xl:inset-x-2.5" />
                )}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          <LocaleSwitcher
            className="max-md:size-9 max-md:justify-center max-md:px-0 max-[359px]:size-8"
            labelClassName="max-md:hidden"
          />
          {/* Hidden on the narrowest phones; the search panel sits right below the hero there */}
          <button
            type="button"
            aria-label={t("header.quickSearch")}
            onClick={scrollToSearchPanel}
            className={cn(iconButtonClass, "size-9 max-[413px]:hidden md:size-10")}
          >
            <Search className="size-5 stroke-2" />
          </button>
          <Link
            href={`/${locale}/login`}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden h-11 rounded-xl px-3 text-sm font-semibold text-neutral-main hover:bg-brand-bg hover:text-brand sm:inline-flex md:px-4"
            )}
          >
            {t("header.login")}
          </Link>
          {/* Icon-only login on phones, where the text buttons don't fit */}
          <Link
            href={`/${locale}/login`}
            aria-label={t("header.login")}
            title={t("header.login")}
            className={cn(iconButtonClass, "size-9 max-[359px]:size-8 sm:hidden")}
          >
            <UserRound className="size-5" />
          </Link>
          <Link
            href={`/${locale}/register`}
            className={cn(
              buttonVariants({ variant: "cta" }),
              "hidden h-11 rounded-full px-5 text-sm font-semibold shadow-sm sm:inline-flex md:px-6"
            )}
          >
            {t("header.register")}
          </Link>
          <button
            type="button"
            aria-label={mobileMenuOpen ? t("header.closeMenu") : t("header.openMenu")}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className={cn(iconButtonClass, "size-9 max-[359px]:size-8 md:size-10 lg:hidden")}
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="space-y-4 border-b border-neutral-border bg-white px-5 py-6 shadow-lg sm:px-6 lg:hidden">
          <nav className="flex flex-col">
            {NAV_ITEMS.map(({ id, href, icon: Icon }) => (
              <a
                key={id}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 border-b border-gray-100 py-2.5 text-base font-medium text-neutral-main transition-colors hover:text-brand"
              >
                <Icon className="size-5 text-brand" aria-hidden />
                {t(`nav.${id}`)}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2.5 pt-2 sm:hidden">
            <Link
              href={`/${locale}/login`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 w-full rounded-xl text-sm font-medium hover:border-brand hover:bg-white hover:text-brand"
              )}
            >
              {t("header.login")}
            </Link>
            <Link
              href={`/${locale}/register`}
              className={cn(
                buttonVariants({ variant: "cta" }),
                "h-11 w-full rounded-xl text-sm font-semibold"
              )}
            >
              {t("header.register")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
