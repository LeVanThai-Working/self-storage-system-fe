"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Info, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  AccessScheduleStatusEnum,
  type AccessScheduleDetailResponse,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiErrorMessage } from "@/features/auth/error-message";
import type { FacilityPortal } from "@/features/inventory-operations/types";
import { formatDateTime } from "@/features/support-desk/utils";
import { useAccessSchedule, useCheckOutAccessSchedule } from "../hooks";
import { formatScheduleDate, getCheckInWindow } from "../utils";
import { AccessScheduleStatusBadge } from "./AccessScheduleStatusBadge";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-sm last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{value ?? "—"}</dd>
    </div>
  );
}

/** Check-out for a visit inside the warehouse; other statuses only get a short hint. */
function GateActions({ schedule }: { schedule: AccessScheduleDetailResponse }) {
  const t = useTranslations("accessScheduleDesk.checkOut");
  const getErrorMessage = useApiErrorMessage();
  const checkOut = useCheckOutAccessSchedule();
  const [staffNotes, setStaffNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (schedule.status === AccessScheduleStatusEnum.PENDING) {
    return (
      <p className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t("pendingHint")}
      </p>
    );
  }
  if (schedule.status !== AccessScheduleStatusEnum.CHECKED_IN) return null;

  const handleCheckOut = async () => {
    setError(null);
    try {
      await checkOut.mutateAsync({
        id: schedule.id,
        payload: { staffNotes: staffNotes.trim() || undefined },
      });
      toast.success(t("success", { code: schedule.scheduleCode }));
      setStaffNotes("");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/50 p-5">
      <p className="text-sm font-bold text-slate-800">{t("title")}</p>
      <input
        value={staffNotes}
        onChange={(event) => setStaffNotes(event.target.value)}
        placeholder={t("notesPlaceholder")}
        maxLength={500}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400"
      />
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <Button
        onClick={() => void handleCheckOut()}
        disabled={checkOut.isPending}
        className="w-full bg-sky-600 text-white hover:bg-sky-700"
      >
        {checkOut.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        {t("submit")}
      </Button>
    </section>
  );
}

/** One warehouse visit: who comes, when, with which vehicle, gate timestamps and check-out. */
export function AccessScheduleDetailView({
  id,
  portalBase,
}: {
  id: string;
  portalBase: FacilityPortal;
}) {
  const t = useTranslations("accessScheduleDesk");
  const locale = useLocale();
  const getErrorMessage = useApiErrorMessage();
  const query = useAccessSchedule(id);
  const schedule = query.data;

  const backHref = `/${locale}/${portalBase}/access-schedules`;

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (query.isError || !schedule) {
    return (
      <div className="space-y-4">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-slate-500">
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Link>
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-700">
          {getErrorMessage(query.error)}
        </p>
      </div>
    );
  }

  const slot = schedule.timeSlotSnapshot;
  const window = getCheckInWindow(slot.startTime);
  const vehicle = [schedule.vehicleType, schedule.vehiclePlate].filter(Boolean).join(" · ");
  const racks = schedule.rentedRacks ?? [];

  return (
    <div className="space-y-5">
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-slate-500">
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-extrabold tracking-tight text-slate-900">
          {schedule.scheduleCode}
        </h1>
        <AccessScheduleStatusBadge status={schedule.status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm font-bold text-slate-800">{t("detail.visit")}</p>
          <dl>
            <Row label={t("detail.customer")} value={schedule.customerName} />
            <Row label={t("detail.phone")} value={schedule.customerPhone} />
            <Row label={t("detail.contract")} value={schedule.contractCode} />
            <Row
              label={t("detail.facility")}
              value={[schedule.facilityCode, schedule.facilityName].filter(Boolean).join(" · ")}
            />
            <Row
              label={t("detail.slot")}
              value={`${formatScheduleDate(schedule.scheduledDate)} · ${slot.slotName} (${slot.startTime}–${slot.endTime})`}
            />
            <Row label={t("detail.window")} value={`${window.from} – ${window.to}`} />
            <Row label={t("detail.people")} value={schedule.numberOfPeople} />
            <Row label={t("detail.vehicle")} value={vehicle || null} />
            <Row label={t("detail.purpose")} value={schedule.purpose} />
          </dl>
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-2 text-sm font-bold text-slate-800">{t("detail.gate")}</p>
            <dl>
              <Row
                label={t("detail.checkedIn")}
                value={
                  schedule.checkedInAt
                    ? `${formatDateTime(schedule.checkedInAt)}${schedule.checkedInByName ? ` · ${schedule.checkedInByName}` : ""}`
                    : null
                }
              />
              <Row
                label={t("detail.checkedOut")}
                value={
                  schedule.checkedOutAt
                    ? `${formatDateTime(schedule.checkedOutAt)}${schedule.checkedOutByName ? ` · ${schedule.checkedOutByName}` : ""}`
                    : null
                }
              />
              {schedule.cancelledAt ? (
                <Row
                  label={t("detail.cancelled")}
                  value={`${formatDateTime(schedule.cancelledAt)}${schedule.cancelledReason ? ` · ${schedule.cancelledReason}` : ""}`}
                />
              ) : null}
              <Row label={t("detail.staffNotes")} value={schedule.staffNotes} />
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-2 text-sm font-bold text-slate-800">{t("detail.racks")}</p>
            {racks.length === 0 ? (
              <p className="text-sm text-slate-500">—</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {racks.map((rack) => (
                  <li
                    key={rack.rackId}
                    className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800"
                  >
                    {rack.rackCode}
                    {rack.aisle ? ` · ${t("detail.aisle", { aisle: rack.aisle })}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <GateActions schedule={schedule} />
        </div>
      </div>
    </div>
  );
}
