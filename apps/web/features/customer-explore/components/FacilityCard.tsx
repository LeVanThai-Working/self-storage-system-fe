"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Clock, MapPin, Phone } from "lucide-react";
import { formatCurrency } from "@self-storage-system-fe/shared";
import type { PublicFacility } from "../api";

const FALLBACK_IMAGE = "/images/landing/hero-facility.jpg";

export function FacilityCard({
  facility,
  priceRange,
}: {
  facility: PublicFacility;
  priceRange?: { min: number; max: number };
}) {
  const t = useTranslations("explore");
  const locale = useLocale();

  return (
    <Link
      href={`/${locale}/customer/facilities/${facility.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-border bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={facility.images?.[0] || FALLBACK_IMAGE}
        alt={facility.name}
        className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-lg font-semibold text-neutral-main">{facility.name}</h3>
        <p className="flex items-start gap-2 text-sm text-neutral-muted">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          {facility.address}, {facility.city}
        </p>
        {facility.operatingHours && (
          <p className="flex items-center gap-2 text-sm text-neutral-muted">
            <Clock className="size-4 shrink-0" aria-hidden />
            {facility.operatingHours.open} – {facility.operatingHours.close}
          </p>
        )}
        {facility.phone && (
          <p className="flex items-center gap-2 text-sm text-neutral-muted">
            <Phone className="size-4 shrink-0" aria-hidden />
            {facility.phone}
          </p>
        )}
        <p className="mt-auto pt-2 text-sm font-semibold text-brand">
          {priceRange
            ? priceRange.min === priceRange.max
              ? formatCurrency(priceRange.min)
              : `${formatCurrency(priceRange.min)} – ${formatCurrency(priceRange.max)}`
            : t("priceContact")}
        </p>
      </div>
    </Link>
  );
}
