"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, ArrowLeft, MapPin } from "lucide-react";
import {
  FacilityAmenityOfferingStatusEnum,
  FacilityUnitTypeOfferingStatusEnum,
  formatCurrency,
  type PublicAmenityOfferingResponse,
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
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useFacilityPublicDetail } from "@/features/customer-explore/hooks";
import { useAvailableTimeSlots } from "@/features/facility-time-slot/hooks";
import { useAvailableUnits, useCreateReservation } from "../hooks";
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
  const units = useAvailableUnits(facilityId, unitTypeId);
  const create = useCreateReservation();

  const [unitId, setUnitId] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [slot, setSlot] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showImmediateWarning, setShowImmediateWarning] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  const slots = useAvailableTimeSlots(facilityId, checkInDate);

  const searchHref = `/${locale}/customer/search`;
  const back = (
    <Link
      href={searchHref}
      className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-muted hover:text-neutral-main"
    >
      <ArrowLeft className="size-4" /> {t("back")}
    </Link>
  );

  const offering = detail.data?.unitTypeOfferings.find(
    (o) => o.unitTypeId === unitTypeId && o.status === FacilityUnitTypeOfferingStatusEnum.ACTIVE
  );

  const facility = detail.data?.facility;
  const availableUnits = units.data ?? [];
  const amenities = (detail.data?.amenityOfferings ?? []).filter(
    (o) => o.status === FacilityAmenityOfferingStatusEnum.ACTIVE && maxQuantity(o) > 0
  );

  const deposit = offering ? depositFor(offering.pricePerUnit, offering.depositMultiplier) : 0;
  const durationNumber = Number(duration);
  const selectedSlot = slots.data?.find((s) => s.slotName === slot);
  const today = localDateString();
  const lastCheckIn = localDateString(MAX_CHECK_IN_DAYS_AHEAD);

  /** Check if check-in is within 24h of now -> BE immediateForfeitWarning invariant */
  const isImmediateForfeit = Boolean(checkInDate && checkInDate <= today);

  const problem = (() => {
    if (!unitId) return t("errors.unit");
    if (!checkInDate) return t("errors.checkInDate");
    if (!selectedSlot?.isAvailable) return t("errors.slot");
    if (!startDate || startDate < checkInDate) return t("errors.startDate");
    if (!Number.isInteger(durationNumber) || !offering || durationNumber < offering.minRentalDays) {
      return t("errors.duration", { min: offering?.minRentalDays ?? 1 });
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

  const doCreateReservation = async () => {
    if (!offering || !facilityId) return;
    setShowImmediateWarning(false);
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
        notes: notes.trim() || undefined,
        termsAccepted: true,
      });
      router.push(`/${locale}/customer/reservations/${reservation.id}/payment`);
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (problem) return;
    if (isImmediateForfeit) {
      setShowImmediateWarning(true);
      return;
    }
    await doCreateReservation();
  };

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

  if (detail.isError || !detail.data || !offering || !facility) {
    return (
      <>
        {back}
        <p className="rounded-2xl border border-neutral-border bg-white p-8 text-center text-neutral-muted">
          {t("offeringUnavailable")}
        </p>
      </>
    );
  }

  return (
    <>
      {back}
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-neutral-muted">
        {offering.unitType.name} · {facility.name}
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Section
            title={t("unit.title")}
            headerExtra={
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                <MapPin className="size-3" />
                {t("unit.mapNotice")}
              </span>
            }
          >
            {availableUnits.length === 0 ? (
              <p className="text-sm text-neutral-muted">{t("unit.empty")}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {availableUnits.map((u) => (
                  <li key={u.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer flex-col rounded-xl border p-3 text-sm transition-colors",
                        unitId === u.id
                          ? "border-brand bg-brand-bg shadow-sm"
                          : "border-neutral-border hover:border-brand/50"
                      )}
                    >
                      <input
                        type="radio"
                        name="unit"
                        value={u.id}
                        checked={unitId === u.id}
                        onChange={() => setUnitId(u.id)}
                        className="sr-only"
                      />
                      <span className="font-semibold">{u.unitNumber}</span>
                      <span className="text-neutral-muted">
                        {t("unit.location", { floor: u.floor, zone: u.zone ?? "—" })}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
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

            <Field
              label={t("schedule.duration", { unit: tBilling(offering.billingUnit) })}
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
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-neutral-border bg-white p-5 lg:sticky lg:top-28">
          <h2 className="text-lg font-semibold">{t("summary.title")}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-muted">{t("summary.price")}</dt>
              <dd className="font-medium">
                {formatCurrency(offering.pricePerUnit)} / {tBilling(offering.billingUnit)}
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

          {/* Terms Agreement & Immediate Forfeit Alert */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3.5 space-y-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-slate-700 select-none">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>{t("terms")}</span>
            </label>

            {isImmediateForfeit && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                <span>{t("immediateWarning.description")}</span>
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

      {/* Immediate Forfeit Warning Confirmation Modal */}
      <Dialog open={showImmediateWarning} onOpenChange={setShowImmediateWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-center">{t("immediateWarning.title")}</DialogTitle>
            <DialogDescription className="text-center text-slate-600 text-sm">
              {t("immediateWarning.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImmediateWarning(false)}
              disabled={create.isPending}
            >
              {t("immediateWarning.cancel")}
            </Button>
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={doCreateReservation}
              disabled={create.isPending}
            >
              {create.isPending ? t("summary.submitting") : t("immediateWarning.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
