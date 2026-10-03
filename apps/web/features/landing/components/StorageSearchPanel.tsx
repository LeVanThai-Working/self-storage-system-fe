"use client";

import { type FormEvent, Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SEARCH_FIELDS,
  SEARCH_FILTER_ALL,
  SEARCH_PANEL_ID,
  type SearchFieldId,
} from "@/features/landing/constants";
import { useClickOutside } from "@/features/landing/hooks/useClickOutside";

type SearchFilters = Record<SearchFieldId, string>;

const INITIAL_FILTERS: SearchFilters = {
  location: SEARCH_FILTER_ALL,
  type: SEARCH_FILTER_ALL,
  size: SEARCH_FILTER_ALL,
  price: SEARCH_FILTER_ALL,
};

export function StorageSearchPanel() {
  const t = useTranslations("landing.search");
  const locale = useLocale();
  const router = useRouter();
  const panelRef = useRef<HTMLFormElement>(null);
  const [filters, setFilters] = useState<SearchFilters>(INITIAL_FILTERS);
  const [activeDropdown, setActiveDropdown] = useState<SearchFieldId | null>(null);

  const closeDropdown = useCallback(() => setActiveDropdown(null), []);
  useClickOutside(panelRef, closeDropdown, activeDropdown !== null);

  useEffect(() => {
    if (!activeDropdown) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDropdown();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeDropdown, closeDropdown]);

  const handleSelect = (field: SearchFieldId, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    closeDropdown();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== SEARCH_FILTER_ALL) params.set(key, value);
    }
    const query = params.toString();
    // TODO: the /search results page is not implemented yet.
    router.push(`/${locale}/search${query ? `?${query}` : ""}`);
  };

  const getValueLabel = (field: SearchFieldId) => {
    const value = filters[field];
    if (field === "location" && value === SEARCH_FILTER_ALL) return t("locationPlaceholder");
    return t(`options.${field}.${value}.label`);
  };

  return (
    <div id={SEARCH_PANEL_ID} className="relative z-30 w-full">
      <form
        ref={panelRef}
        onSubmit={handleSubmit}
        className="grid grid-cols-1 items-stretch gap-3 rounded-3xl border border-neutral-border bg-white p-3 shadow-search-panel sm:p-4 md:grid-cols-2 xl:flex xl:flex-row xl:items-center xl:justify-between xl:gap-2 xl:p-3"
      >
        {SEARCH_FIELDS.map((field, index) => {
          const Icon = field.icon;
          const isOpen = activeDropdown === field.id;
          const optionsId = `search-${field.id}-options`;

          return (
            <Fragment key={field.id}>
              {index > 0 && (
                <div className="hidden h-10 w-px shrink-0 bg-neutral-border xl:block" />
              )}
              {/* min-w-0 lets the field shrink so long values truncate instead of stretching the panel */}
              <div className="group relative min-w-0 flex-1">
                {/* Disclosure pattern: the trigger toggles a list of option buttons */}
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={optionsId}
                  title={getValueLabel(field.id)}
                  onClick={() => setActiveDropdown(isOpen ? null : field.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left transition-all hover:bg-brand-pageBg",
                    isOpen && "bg-brand-bg ring-1 ring-brand/20"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-bg text-brand transition-transform group-hover:scale-105">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate text-[11px] font-semibold tracking-wider text-neutral-muted uppercase">
                        {t(`fields.${field.id}`)}
                      </span>
                      <span className="block truncate text-sm font-semibold text-neutral-main">
                        {getValueLabel(field.id)}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-[#8BA0A3] transition-transform duration-200",
                      isOpen && "rotate-180 text-brand"
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="absolute top-full right-0 left-0 z-50 mt-2 rounded-2xl border border-neutral-border bg-white py-2 shadow-xl sm:right-auto sm:min-w-[260px]">
                    <ul
                      id={optionsId}
                      aria-label={t(`fields.${field.id}`)}
                      className="max-h-64 overflow-y-auto px-1"
                    >
                      {field.options.map((option) => {
                        const isSelected = filters[field.id] === option;
                        return (
                          <li key={option}>
                            <button
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => handleSelect(field.id, option)}
                              className={cn(
                                "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-brand-bg hover:text-brand-dark",
                                isSelected
                                  ? "bg-brand-light font-semibold text-brand-dark"
                                  : "text-neutral-main"
                              )}
                            >
                              <div>
                                <div className="text-xs font-medium sm:text-sm">
                                  {t(`options.${field.id}.${option}.label`)}
                                </div>
                                <div className="mt-0.5 text-[11px] font-normal text-neutral-muted">
                                  {t(`options.${field.id}.${option}.sublabel`)}
                                </div>
                              </div>
                              {isSelected && <Check className="size-4 shrink-0 text-brand" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </Fragment>
          );
        })}

        <div className="shrink-0 md:col-span-2 xl:pl-2">
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "cta" }),
              "h-auto w-full gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold shadow-md hover:shadow-lg xl:w-auto"
            )}
          >
            <Search className="size-4 stroke-[2.5]" />
            {t("submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
