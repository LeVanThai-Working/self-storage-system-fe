"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import {
  FacilityAmenityOfferingStatusEnum,
  FREE_CANCEL_HOURS,
  FacilityUnitTypeOfferingStatusEnum,
  MESSAGE_CODE,
  RESERVATION_RACK_SELECTION_SUPPORTED,
  UnitTypeCategoryEnum,
  formatCurrency,
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-neutral-border bg-white p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
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

  const searchHref = `/${locale}/customer/search`;
  const back = (
    <Link
      href={searchHref}
      className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-muted hover:text-neutral-main"
    >
      <ArrowLeft className="size-4" /> {t("back")}
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
      const code = err instanceof AppApiError ? err.messageCode : undefined;
      if (code === MESSAGE_CODE.MESSAGE_CODE_637) {
        // A picked rack was reserved by someone else meanwhile.
        setRackSelection(null);
        void racks.refetch();
        setServerError(t("errors.rackTaken"));
        return;
      }
      if (code === MESSAGE_CODE.MESSAGE_CODE_309) {
        setUnitId("");
        void units.refetch();
      }
      // Slot full, closed, already started or too close to prepare: pick another one.
      if (
        code === MESSAGE_CODE.MESSAGE_CODE_310 ||
        code === MESSAGE_CODE.MESSAGE_CODE_311 ||
        code === MESSAGE_CODE.MESSAGE_CODE_315 ||
        code === MESSAGE_CODE.MESSAGE_CODE_328
      ) {
        setSlot("");
        void slots.refetch();
      }
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <>
      {back}
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-neutral-muted">
        {offering.unitType.name} · {facility.name}
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Section title={t("unit.title")}>
            {mapUnits.length === 0 ? (
              <p className="text-sm text-neutral-muted">{t("unit.empty")}</p>
            ) : (
              <UnitSeatMapWeb
                units={mapUnits}
                selectedUnitId={unitId}
                onSelect={(unit) => setUnitId(unit.id)}
              />
            )}
            {isRackWarehouse && unitId ? (
              <div className="space-y-3 border-t border-neutral-border pt-4">
                <h3 className="text-sm font-semibold">{t("seatMap.racksTitle")}</h3>
                {racks.isLoading ? (
                  <Skeleton className="h-40 rounded-xl" />
                ) : (racks.data ?? []).length === 0 ? (
                  <p className="text-sm text-neutral-muted">{t("seatMap.noRacks")}</p>
                ) : (
                  <RackSeatMapWeb
                    racks={racks.data ?? []}
                    pricing={zonePricing.data}
                    fallbackPrice={offering.pricePerUnit}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("schedule.checkInDate")}
                hint={t("schedule.checkInHint", { days: MAX_CHECK_IN_DAYS_AHEAD })}
              >
                <input
                  type="date"
                  className={fieldClass}
                  min={today}
                  max={lastCheckIn}
                  value={checkInDate}
                  onChange={(e) => {
                    setCheckInDate(e.target.value);
                    setSlot("");
                    if (startDate && startDate < e.target.value) setStartDate("");
                  }}
                />
              </Field>
              <Field label={t("schedule.startDate")} hint={t("schedule.startHint")}>
                <input
                  type="date"
                  className={fieldClass}
                  min={checkInDate || today}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Field>
            </div>

            <div className="space-y-1.5">
              <span className="text-sm font-medium">{t("schedule.timeSlot")}</span>
              {!checkInDate ? (
                <p className="text-sm text-neutral-muted">{t("schedule.pickDateFirst")}</p>
              ) : slots.isLoading ? (
                <Skeleton className="h-12 rounded-xl" />
              ) : slots.isError ? (
                <p className="text-sm text-red-600">{t("schedule.slotsError")}</p>
              ) : (slots.data ?? []).length === 0 ? (
                <p className="text-sm text-neutral-muted">{t("schedule.noSlots")}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.data!.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={!s.isAvailable}
                      onClick={() => setSlot(s.slotName)}
                      aria-pressed={slot === s.slotName}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                        slot === s.slotName
                          ? "border-brand bg-brand-bg"
                          : "border-neutral-border hover:border-brand/50"
                      )}
                    >
                      <span className="block font-semibold">{s.slotName}</span>
                      <span className="block text-xs text-neutral-muted">
                        {/* Slot names are often just the hours, so only repeat them when they add info */}
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

            <Field
              label={t("schedule.duration")}
              hint={t("schedule.durationHint", { min: offering.minRentalDays })}
            >
              <Input
                type="number"
                inputMode="numeric"
                min={offering.minRentalDays}
                step={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </Field>
          </Section>

          {amenities.length > 0 && (
            <Section title={t("amenities.title")}>
              <p className="text-sm text-neutral-muted">{t("amenities.note")}</p>
              <ul className="space-y-3">
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

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-border bg-white p-5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-brand"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <span>{t("terms.label")}</span>
          </label>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("forfeitWarning.title")}</DialogTitle>
            <DialogDescription>{t("forfeitWarning.body")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForfeitConfirmOpen(false)}>
              {t("forfeitWarning.back")}
            </Button>
            <Button onClick={() => void submit()} disabled={create.isPending}>
              {t("forfeitWarning.continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
