"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Clock, Mail, MapPin, Phone } from "lucide-react";
import { formatCurrency, type PublicAmenityOfferingResponse } from "@self-storage-system-fe/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PublicFacility } from "../api";
import { useFacilityPublicDetail } from "../hooks";

const FALLBACK_IMAGE = "/images/landing/hero-facility.jpg";

function AmenityCard({ offering }: { offering: PublicAmenityOfferingResponse }) {
  const t = useTranslations("explore.detail");
  const { amenity } = offering;
  const isFree = offering.pricePerUnit === 0;

  return (
    <li className="rounded-xl border border-neutral-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-semibold">{amenity.name}</h4>
        <Badge variant="outline">{t(`amenityType.${amenity.type}`)}</Badge>
      </div>
      {amenity.description && (
        <p className="mt-1 text-sm text-neutral-muted">{amenity.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className={isFree ? "font-semibold text-green-700" : "font-semibold text-brand"}>
          {isFree
            ? t("free")
            : `${formatCurrency(offering.pricePerUnit)} / ${t(`billing.${offering.billingUnit}`)}`}
        </span>
        {/* Services have no stock, so the BE returns null for their quantity */}
        {typeof offering.availableQuantity === "number" && (
          <span className="text-neutral-muted">
            {t("available", { count: offering.availableQuantity })}
          </span>
        )}
      </div>
    </li>
  );
}

function AmenitySection({
  title,
  items,
}: {
  title: string;
  items: PublicAmenityOfferingResponse[];
}) {
  const t = useTranslations("explore.detail");
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">
        {title} <span className="text-neutral-muted">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-muted">{t("noAmenities")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((o) => (
            <AmenityCard key={o.id} offering={o} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function FacilityDetailPage({ id }: { id: string }) {
  const t = useTranslations("explore");
  const locale = useLocale();
  const { data, isLoading, isError, refetch } = useFacilityPublicDetail(id);

  const back = (
    <Link
      href={`/${locale}/customer/facilities`}
      className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-muted hover:text-neutral-main"
    >
      <ArrowLeft className="size-4" /> {t("detail.back")}
    </Link>
  );

  if (isLoading) {
    return (
      <>
        {back}
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="mt-6 h-40 rounded-2xl" />
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        {back}
        <div className="rounded-2xl border border-neutral-border bg-white p-8 text-center">
          <p className="text-neutral-muted">{t("detail.error")}</p>
          <Button className="mt-4" onClick={() => refetch()}>
            {t("retry")}
          </Button>
        </div>
      </>
    );
  }

  const facility: PublicFacility = data.facility;
  // An amenity priced at 0 is included for free; anything else is a paid add-on service.
  const freeAmenities = data.amenityOfferings.filter((o) => o.pricePerUnit === 0);
  const paidAmenities = data.amenityOfferings.filter((o) => o.pricePerUnit > 0);

  return (
    <>
      {back}
      <div className="overflow-hidden rounded-2xl border border-neutral-border bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={facility.images?.[0] || FALLBACK_IMAGE}
          alt={facility.name}
          className="h-64 w-full object-cover"
        />
        <div className="space-y-4 p-6">
          <h1 className="text-3xl font-bold">{facility.name}</h1>
          <ul className="grid gap-3 text-neutral-muted sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              {facility.address}, {facility.city}
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-4 shrink-0" aria-hidden />
              {facility.operatingHours
                ? `${facility.operatingHours.open} – ${facility.operatingHours.close}`
                : t("detail.hoursUnknown")}
            </li>
            {facility.phone && (
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" aria-hidden />
                <a href={`tel:${facility.phone}`} className="hover:text-brand">
                  {facility.phone}
                </a>
              </li>
            )}
            {facility.email && (
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" aria-hidden />
                {facility.email}
              </li>
            )}
          </ul>
          {facility.description && <p className="text-neutral-main">{facility.description}</p>}
        </div>
      </div>

      <section className="mt-10 space-y-8">
        <h2 className="text-2xl font-bold">{t("detail.amenities")}</h2>
        <AmenitySection title={t("detail.freeAmenities")} items={freeAmenities} />
        <AmenitySection title={t("detail.paidAmenities")} items={paidAmenities} />
      </section>
    </>
  );
}
