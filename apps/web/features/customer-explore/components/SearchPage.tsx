"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, Ruler } from "lucide-react";
import { formatCurrency, type BillingUnitEnum } from "@self-storage-system-fe/shared";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/store";
import {
  usePublicAmenities,
  usePublicFacilities,
  usePublicUnitTypes,
  useUnitSearch,
} from "../hooks";
import {
  EMPTY_FILTERS,
  filtersFromLandingParams,
  type SearchFilters,
  type SearchResult,
} from "../search";

const selectClass =
  "w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 cursor-pointer";

/** The BE owns the category list, so an unknown value shows as-is instead of breaking the page. */
function categoryLabel(t: ReturnType<typeof useTranslations>, category: string) {
  return t.has(`category.${category}`) ? t(`category.${category}`) : category;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-neutral-main">{label}</span>
      {children}
    </label>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  const t = useTranslations("explore.search");
  const locale = useLocale();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { unitType, facility } = result;

  const bookingPath = `/${locale}/customer/reservations/new?facilityId=${facility.id}&unitTypeId=${result.unitTypeId}`;
  const href = isAuthenticated
    ? bookingPath
    : `/${locale}/login?redirect=${encodeURIComponent(bookingPath)}`;

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-neutral-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold">{unitType.name}</h3>
        <Badge variant="outline">{categoryLabel(t, unitType.category)}</Badge>
      </div>
      <Link
        href={`/${locale}/customer/facilities/${facility.id}`}
        className="flex items-start gap-2 text-sm text-neutral-muted hover:text-brand"
      >
        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
        {facility.name} · {facility.city}
      </Link>
      <p className="flex items-center gap-2 text-sm text-neutral-muted">
        <Ruler className="size-4 shrink-0" aria-hidden />
        {unitType.dimensions.length} × {unitType.dimensions.width} × {unitType.dimensions.height} m
        · {unitType.area} m²
      </p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-2">
        <div>
          <p className="text-lg font-bold text-brand">
            {formatCurrency(result.pricePerUnit)}
            <span className="text-sm font-normal text-neutral-muted">
              {" / "}
              {t(`billing.${result.billingUnit as BillingUnitEnum}`)}
            </span>
          </p>
          <p className="text-xs text-neutral-muted">
            {t("availableUnits", { count: result.availableUnitsCount })}
          </p>
        </div>
        <Link href={href} className={cn(buttonVariants(), "bg-cta text-white hover:bg-cta/90")}>
          {t("reserveNow")}
        </Link>
      </div>
    </li>
  );
}

export function SearchPage({
  initialType,
  initialPrice,
}: {
  initialType?: string;
  initialPrice?: string;
}) {
  const t = useTranslations("explore.search");
  const initial = filtersFromLandingParams({ type: initialType, price: initialPrice });
  const [draft, setDraft] = useState<SearchFilters>(initial);
  const [applied, setApplied] = useState<SearchFilters>(initial);

  const facilities = usePublicFacilities({ page: 1, limit: 100 });
  const unitTypes = usePublicUnitTypes();
  const amenities = usePublicAmenities();
  const categories = [
    ...new Set(unitTypes.data?.map((u) => u.category).filter(Boolean)),
  ] as string[];
  const { results, isLoading, isError } = useUnitSearch(applied);

  const set = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleAmenity = (id: string) =>
    set(
      "amenityIds",
      draft.amenityIds.includes(id)
        ? draft.amenityIds.filter((a) => a !== id)
        : [...draft.amenityIds, id]
    );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setApplied(draft);
  };

  const onReset = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };

  return (
    <>
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-neutral-muted">{t("subtitle")}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
        <form
          onSubmit={onSubmit}
          className="h-fit space-y-4 rounded-2xl border border-neutral-border bg-white p-5"
        >
          <Field label={t("facility")}>
            <select
              className={selectClass}
              value={draft.facilityId}
              onChange={(e) => set("facilityId", e.target.value)}
            >
              <option value="">{t("all")}</option>
              {facilities.data?.items.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("unitType")}>
            <select
              className={selectClass}
              value={draft.unitTypeId}
              onChange={(e) => set("unitTypeId", e.target.value)}
            >
              <option value="">{t("all")}</option>
              {unitTypes.data?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("categoryLabel")}>
            <select
              className={selectClass}
              value={draft.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="">{t("all")}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(t, c)}
                </option>
              ))}
            </select>
          </Field>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">{t("area")}</legend>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                placeholder={t("min")}
                value={draft.minArea}
                onChange={(e) => set("minArea", e.target.value)}
              />
              <Input
                type="number"
                min={0}
                placeholder={t("max")}
                value={draft.maxArea}
                onChange={(e) => set("maxArea", e.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">{t("price")}</legend>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                step={50000}
                placeholder={t("min")}
                value={draft.minPrice}
                onChange={(e) => set("minPrice", e.target.value)}
              />
              <Input
                type="number"
                min={0}
                step={50000}
                placeholder={t("max")}
                value={draft.maxPrice}
                onChange={(e) => set("maxPrice", e.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("amenities")}</legend>
            {amenities.data?.map((a) => (
              <label key={a.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.amenityIds.includes(a.id)}
                  onChange={() => toggleAmenity(a.id)}
                  className="size-4 accent-(--color-brand,#0d9488)"
                />
                {a.name}
              </label>
            ))}
          </fieldset>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              {t("apply")}
            </Button>
            <Button type="button" variant="outline" onClick={onReset}>
              {t("reset")}
            </Button>
          </div>
        </form>

        <section aria-live="polite">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : isError ? (
            <p className="rounded-2xl border border-neutral-border bg-white p-8 text-center text-neutral-muted">
              {t("error")}
            </p>
          ) : results.length === 0 ? (
            <p className="rounded-2xl border border-neutral-border bg-white p-8 text-center text-neutral-muted">
              {t("empty")}
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm text-neutral-muted">
                {t("count", { count: results.length })}
              </p>
              <ul className="grid gap-4 sm:grid-cols-2">
                {results.map((r) => (
                  <ResultCard key={r.id} result={r} />
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </>
  );
}
