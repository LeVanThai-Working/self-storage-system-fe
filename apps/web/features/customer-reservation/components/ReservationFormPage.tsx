"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, ArrowLeft, MapPin } from "lucide-react";
import {
  FacilityAmenityOfferingStatusEnum,
  FREE_CANCEL_HOURS,
  FacilityUnitTypeOfferingStatusEnum,
  MESSAGE_CODE,
  RESERVATION_RACK_SELECTION_SUPPORTED,
  UnitTypeCategoryEnum,
  formatCurrency,
  DEFAULT_RACK_ZONE_PRICING,
  getRackPrice,
  isInsideForfeitWindow,
  type PublicAmenityOfferingResponse,
  type StorageRackResponse,
} from "@self-storage-system-fe/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AppApiError } from "@/lib/api/axios";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useFacilityPublicDetail } from "@/features/customer-explore/hooks";
import { useAvailableTimeSlots } from "@/features/facility-time-slot/hooks";
import {
  useBookableRacks,
  useBookableUnits,
  useCreateReservation,
  useOfferingZonePricing,
} from "../hooks";
import { RackSeatMapWeb, UnitSeatMapWeb } from "./SeatMaps";
import { MAX_CHECK_IN_DAYS_AHEAD, depositFor, localDateString, toVietnamIso } from "../utils";

/** Services have no stock, so there is no natural cap; this keeps the stepper sane. */
const MAX_SERVICE_QUANTITY = 99;

const fieldClass =
  "w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

function Section({
  title,
  headerExtra,
  children,
}: {
  title: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-neutral-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {headerExtra}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-neutral-main">{label}</span>
      {children}
      {hint && <span className="block text-xs text-neutral-muted">{hint}</span>}
    </label>
  );
}

const maxQuantity = (o: PublicAmenityOfferingResponse) =>
  typeof o.availableQuantity === "number" ? o.availableQuantity : MAX_SERVICE_QUANTITY;

export function ReservationFormPage({
  facilityId,
  unitTypeId,
}: {
  facilityId?: string;
  unitTypeId?: string;
}) {
  const t = useTranslations("customerReservation.form");
  const tBilling = useTranslations("explore.detail.billing");
  const locale = useLocale();
  const router = useRouter();
  const getErrorMessage = useApiErrorMessage();

  const detail = useFacilityPublicDetail(facilityId ?? "");
  const units = useBookableUnits(facilityId, unitTypeId);
  const create = useCreateReservation();

  const [unitId, setUnitId] = useState("");
  const [rackSelection, setRackSelection] = useState<{ unitId: string; rackIds: string[] } | null>(
    null
  );
  const [checkInDate, setCheckInDate] = useState("");
  const [slot, setSlot] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [forfeitConfirmOpen, setForfeitConfirmOpen] = useState(false);

  const slots = useAvailableTimeSlots(facilityId, checkInDate);

  const activeOffering = detail.data?.unitTypeOfferings.find(
    (o) => o.unitTypeId === unitTypeId && o.status === FacilityUnitTypeOfferingStatusEnum.ACTIVE
  );
  const isRackWarehouse = activeOffering?.unitType.category === UnitTypeCategoryEnum.WAREHOUSE_RACK;
  const racks = useBookableRacks(unitId || undefined, isRackWarehouse);
  const zonePricing = useOfferingZonePricing(activeOffering?.id, isRackWarehouse);
  const selectedRackIds = rackSelection?.unitId === unitId ? rackSelection.rackIds : [];
  const selectedRacks = (racks.data ?? []).filter((rack) => selectedRackIds.includes(rack.id));
  const rackMonthlyTotal = selectedRacks.reduce(
    (sum, rack) => sum + getRackPrice(rack, zonePricing.data, activeOffering?.pricePerUnit),
    0
  );
  const isRackBooking = isRackWarehouse && selectedRacks.length > 0;
  const toggleRack = (rack: StorageRackResponse) => {
    const next = selectedRackIds.includes(rack.id)
      ? selectedRackIds.filter((id) => id !== rack.id)
      : [...selectedRackIds, rack.id];
    setRackSelection({ unitId, rackIds: next });
  };

  const searchHref = `/${locale}/customer/explore/${facilityId ?? ""}`;
  const back = (
    <Link
      href={searchHref}
      className="inline-flex items-center gap-2 text-sm text-neutral-muted hover:text-neutral-main"
    >
      <ArrowLeft className="size-4" />
      {t("back")}
    </Link>
  );

  if (!facilityId || !unitTypeId) {
    return (
      <>
        {back}
        <p className="rounded-2xl border border-neutral-border bg-white p-8 text-center text-neutral-muted">
          {t("missingParams")}
        </p>
      </>
    );
  }

  if (detail.isLoading || units.isLoading) {
    return (
      <>
        {back}
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="mt-6 h-48 rounded-2xl" />
      </>
    );
  }

  const offering = detail.data?.unitTypeOfferings.find(
    (o) => o.unitTypeId === unitTypeId && o.status === FacilityUnitTypeOfferingStatusEnum.ACTIVE
  );

  if (detail.isError || !detail.data || !offering) {
    return (
      <>
        {back}
        <p className="rounded-2xl border border-neutral-border bg-white p-8 text-center text-neutral-muted">
          {t("offeringUnavailable")}
        </p>
      </>
    );
  }

  const facility = detail.data.facility;
  const mapUnits = units.data ?? [];
  const amenities = detail.data.amenityOfferings.filter(
    (o) => o.status === FacilityAmenityOfferingStatusEnum.ACTIVE && maxQuantity(o) > 0
  );

  // BE prices a rack booking as the sum of the picked racks instead of the unit price.
  const basePrice = isRackBooking ? rackMonthlyTotal : offering.pricePerUnit;
  const deposit = depositFor(basePrice, offering.depositMultiplier);
  const durationNumber = Number(duration);
  const selectedSlot = slots.data?.find((s) => s.slotName === slot);
  const today = localDateString();
  const lastCheckIn = localDateString(MAX_CHECK_IN_DAYS_AHEAD);

  const problem = (() => {
    if (!unitId) return t("errors.unit");
    if (isRackWarehouse && selectedRackIds.length === 0) return t("errors.racks");
    if (!checkInDate) return t("errors.checkInDate");
    if (!selectedSlot?.isAvailable) return t("errors.slot");
    if (!startDate || startDate < checkInDate) return t("errors.startDate");
    if (!Number.isInteger(durationNumber) || durationNumber < offering.minRentalDays) {
      return t("errors.duration", { min: offering.minRentalDays });
    }
    if (!termsAccepted) return t("errors.terms");
    return null;
  })();
  // Validation messages stay live once the user has tried to submit, so they clear as the form is fixed.
  const error = (tried ? problem : null) ?? serverError;

  const setQuantity = (o: PublicAmenityOfferingResponse, raw: string) => {
    const next = Math.min(Math.max(Math.floor(Number(raw)) || 0, 0), maxQuantity(o));
    setQuantities((q) => ({ ...q, [o.id]: next }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (problem) return;
    // Booking inside the no-refund window: the customer confirms before the unit is held.
    if (isInsideForfeitWindow(checkInDate, slot)) {
      setForfeitConfirmOpen(true);
      return;
    }
    await submit();
  };

  const submit = async () => {
    setForfeitConfirmOpen(false);
    setServerError(null);
    try {
      const reservation = await create.mutateAsync({
        facilityId,
        storageUnitId: unitId,
        facilityUnitTypeOfferingId: offering.id,
        checkInDate: toVietnamIso(checkInDate),
        checkInTimeSlot: slot,
        startDate: toVietnamIso(startDate),
        rentalDuration: durationNumber,
        amenities: Object.entries(quantities)
          .filter(([, quantity]) => quantity > 0)
          .map(([facilityAmenityOfferingId, quantity]) => ({
            facilityAmenityOfferingId,
            quantity,
          })),
        notes: notes.trim().slice(0, 1000) || undefined,
        rentedRackIds:
          RESERVATION_RACK_SELECTION_SUPPORTED && isRackWarehouse ? selectedRackIds : undefined,
        termsAccepted: true,
      });
      router.push(`/${locale}/customer/reservations/${reservation.id}/payment`);
    } catch (err) {
      if (err instanceof AppApiError) {
        if (err.messageCode === MESSAGE_CODE.MESSAGE_CODE_309) {
          units.refetch();
          setServerError(t("serverErrors.unitTaken"));
          return;
        }
        if (err.messageCode === MESSAGE_CODE.MESSAGE_CODE_310) {
          slots.refetch();
          setServerError(t("serverErrors.slotFull"));
          return;
        }
      }
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <>
      {back}

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-main">{t("title")}</h1>
        <p className="text-sm text-neutral-muted">
          {facility.name} · {offering.unitType.name}
        </p>
      </header>

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section
            title={t("unit.title")}
            headerExtra={
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                <MapPin className="size-3" />
                {t("unit.mapNotice")}
              </span>
            }
          >
            <p className="text-xs text-neutral-muted">{t("seatMap.unitHint")}</p>
            <UnitSeatMapWeb
              units={mapUnits}
              selectedUnitId={unitId}
              onSelect={(unit) => {
                setUnitId(unit.id);
                setRackSelection(null);
              }}
            />
            {isRackWarehouse && unitId ? (
              <div className="space-y-3 rounded-2xl border border-neutral-border bg-neutral-50/60 p-4">
                <div>
                  <h3 className="font-semibold text-neutral-main">{t("seatMap.rackTitle")}</h3>
                  <p className="text-xs text-neutral-muted">{t("seatMap.rackHint")}</p>
                </div>
                {racks.isLoading ? (
                  <Skeleton className="h-40 rounded-xl" />
                ) : (
                  <RackSeatMapWeb
                    racks={racks.data ?? []}
                    pricing={zonePricing.data ?? DEFAULT_RACK_ZONE_PRICING}
                    fallbackPrice={offering?.pricePerUnit ?? null}
                    selectedRackIds={selectedRackIds}
                    onToggle={toggleRack}
                  />
                )}
                {selectedRacks.length > 0 ? (
                  <p className="rounded-xl bg-brand-bg px-3 py-2 text-sm font-semibold">
                    {t("seatMap.selection", {
                      count: selectedRacks.length,
                      codes: selectedRacks.map((rack) => rack.rackCode).join(", "),
                      total: formatCurrency(rackMonthlyTotal),
                    })}
                  </p>
                ) : null}
                <p className="text-xs text-neutral-muted">{t("seatMap.estimateNote")}</p>
              </div>
            ) : null}
          </Section>

          <Section title={t("schedule.title")}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("schedule.checkInDate")} hint={t("schedule.checkInHint")}>
                <Input
                  type="date"
                  min={today}
                  max={lastCheckIn}
                  value={checkInDate}
                  onChange={(e) => {
                    setCheckInDate(e.target.value);
                    setSlot("");
                    if (!startDate || startDate < e.target.value) setStartDate(e.target.value);
                  }}
                />
              </Field>

              <Field label={t("schedule.startDate")} hint={t("schedule.startHint")}>
                <Input
                  type="date"
                  min={checkInDate || today}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Field>
            </div>

            <Field label={t("schedule.duration")} hint={t("schedule.durationHint")}>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={offering.minRentalDays}
                  placeholder={String(offering.minRentalDays)}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-neutral-muted">
                  {t("schedule.durationUnit", { unit: tBilling(offering.billingUnit) })}
                </span>
              </div>
            </Field>

            <div className="space-y-2">
              <span className="text-sm font-medium text-neutral-main">{t("schedule.slot")}</span>
              {!checkInDate ? (
                <p className="text-xs text-neutral-muted">{t("schedule.pickDateFirst")}</p>
              ) : slots.isLoading ? (
                <Skeleton className="h-20 rounded-xl" />
              ) : (slots.data ?? []).length === 0 ? (
                <p className="text-xs text-neutral-muted">{t("schedule.noSlots")}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(slots.data ?? []).map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      disabled={!s.isAvailable}
                      onClick={() => setSlot(s.slotName)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                        slot === s.slotName
                          ? "border-brand bg-brand-bg font-semibold"
                          : "border-neutral-border hover:border-brand/50"
                      )}
                    >
                      <span className="block">{s.slotName}</span>
                      <span className="block text-xs text-neutral-muted">
                        {s.slotName.includes(s.startTime) ? "" : `${s.startTime} – ${s.endTime} · `}
                        {s.isAvailable
                          ? t("schedule.left", { count: s.availableCapacity })
                          : t("schedule.full")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {amenities.length > 0 && (
            <Section title={t("amenities.title")}>
              <ul className="space-y-2">
                {amenities.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-neutral-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{o.amenity.name}</p>
                      <p className="text-sm text-neutral-muted">
                        {o.pricePerUnit === 0
                          ? t("amenities.free")
                          : `${formatCurrency(o.pricePerUnit)} / ${tBilling(o.billingUnit)}`}
                        {typeof o.availableQuantity === "number" &&
                          ` · ${t("amenities.left", { count: o.availableQuantity })}`}
                      </p>
                    </div>
                    <Input
                      type="number"
                      inputMode="numeric"
                      aria-label={t("amenities.quantity", { name: o.amenity.name })}
                      className="w-20 shrink-0"
                      min={0}
                      max={maxQuantity(o)}
                      value={quantities[o.id] ?? 0}
                      onChange={(e) => setQuantity(o, e.target.value)}
                    />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title={t("notes.title")}>
            <textarea
              className={cn(fieldClass, "min-h-24 resize-y")}
              maxLength={1000}
              placeholder={t("notes.placeholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Section>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-neutral-border bg-white p-5 lg:sticky lg:top-28">
          <h2 className="text-lg font-semibold">{t("summary.title")}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-muted">
                {isRackBooking
                  ? t("summary.rackEstimate", { count: selectedRacks.length })
                  : t("summary.price")}
              </dt>
              <dd className="font-medium">
                {formatCurrency(basePrice)} / {tBilling(offering.billingUnit)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-muted">{t("summary.multiplier")}</dt>
              <dd className="font-medium">× {offering.depositMultiplier}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-neutral-border pt-2 text-base">
              <dt className="font-semibold">{t("summary.deposit")}</dt>
              <dd className="font-bold text-brand">{formatCurrency(deposit)}</dd>
            </div>
          </dl>
          <p className="text-xs text-neutral-muted">{t("summary.holdNote")}</p>
          <div className="space-y-2 rounded-xl border border-neutral-border bg-neutral-50 p-3">
            <ul className="list-disc space-y-1 pl-4 text-xs text-neutral-muted">
              <li>{t("terms.freeCancel", { hours: FREE_CANCEL_HOURS })}</li>
              <li>{t("terms.forfeit")}</li>
            </ul>
            <label className="flex cursor-pointer items-start gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="mt-0.5 size-4 accent-[var(--color-brand,#0b927e)]"
              />
              {t("terms.accept")}
            </label>
            {isInsideForfeitWindow(checkInDate, slot) && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                <span>{t("forfeitWarning.body")}</span>
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? t("summary.submitting") : t("summary.submit")}
          </Button>
          <Link href={searchHref} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            {t("summary.cancel")}
          </Link>
        </aside>
      </form>

      <Dialog open={forfeitConfirmOpen} onOpenChange={setForfeitConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-center">{t("forfeitWarning.title")}</DialogTitle>
            <DialogDescription className="text-center text-slate-600 text-sm">
              {t("forfeitWarning.body")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setForfeitConfirmOpen(false)}
              disabled={create.isPending}
            >
              {t("forfeitWarning.back")}
            </Button>
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => void submit()}
              disabled={create.isPending}
            >
              {create.isPending ? t("summary.submitting") : t("forfeitWarning.continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
