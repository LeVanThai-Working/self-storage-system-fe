"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { isLocale, localeLabels, locales } from "@/lib/i18n/locales";

interface LocaleSwitcherProps {
  className?: string;
  /** Classes for the locale code + chevron, e.g. `max-md:hidden` for an icon-only trigger */
  labelClassName?: string;
}

export function LocaleSwitcher({ className, labelClassName }: LocaleSwitcherProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentLabel = isLocale(locale) ? localeLabels[locale].short : locale.toUpperCase();

  const switchLocale = (nextLocale: string) => {
    if (nextLocale === locale || !isLocale(nextLocale)) return;

    // Swap the leading locale segment, keeping the rest of the path, query and hash
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    const { search, hash } = window.location;

    startTransition(() => {
      router.replace(`${segments.join("/")}${search}${hash}`, { scroll: false });
    });
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={t("language")}
        disabled={isPending}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-neutral-main transition-colors outline-none hover:bg-brand-bg hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-60 data-popup-open:bg-brand-bg data-popup-open:text-brand",
          className
        )}
      >
        <Globe className="size-[18px]" />
        <span className={cn("inline-flex items-center gap-1.5", labelClassName)}>
          {currentLabel}
          <ChevronDown className="size-3.5 opacity-70" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-auto min-w-40 rounded-xl p-1.5">
        <DropdownMenuRadioGroup value={locale} onValueChange={switchLocale}>
          {locales.map((item) => (
            <DropdownMenuRadioItem
              key={item}
              value={item}
              className="cursor-pointer gap-2.5 rounded-lg py-2 text-sm text-neutral-main focus:bg-brand-bg focus:text-brand-dark data-checked:font-semibold data-checked:text-brand-dark"
            >
              <span className="w-6 text-xs font-bold text-neutral-muted">
                {localeLabels[item].short}
              </span>
              {localeLabels[item].label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
