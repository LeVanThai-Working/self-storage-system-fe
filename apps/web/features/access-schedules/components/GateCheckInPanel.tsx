"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import {
  checkInAccessScheduleSchema,
  type AccessScheduleCheckInResponse,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/tooltip";
import { useApiErrorMessage } from "@/features/auth/error-message";
import type { FacilityPortal } from "@/features/inventory-operations/types";
import { useCheckInAccessSchedule } from "../hooks";
import { formatScheduleDate } from "../utils";

const INPUT =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-400";

/**
 * Gate check-in: a handheld scanner types the QR payload into the field (like a keyboard),
 * or the guard types the 6-digit OTP the customer reads out. Either one is accepted.
 */
export function GateCheckInPanel({ portalBase }: { portalBase: FacilityPortal }) {
  const t = useTranslations("accessScheduleDesk.gate");
  const locale = useLocale();
  const getErrorMessage = useApiErrorMessage();
  const checkIn = useCheckInAccessSchedule();
  const [code, setCode] = useState("");
  const [staffNotes, setStaffNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AccessScheduleCheckInResponse | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const parsed = checkInAccessScheduleSchema.safeParse({
      code,
      staffNotes: staffNotes.trim() || undefined,
    });
    if (!parsed.success) {
      setError(t("codeRequired"));
      return;
    }
    try {
      const response = await checkIn.mutateAsync(parsed.data);
      setResult(response);
      setCode("");
      setStaffNotes("");
      toast.success(t("success", { code: response.schedule.scheduleCode }));
    } catch (err) {
      setResult(null);
      setError(getErrorMessage(err));
    }
  };

  const schedule = result?.schedule;

  return (
    <section
      className={`grid gap-4 rounded-xl border border-teal-200 bg-teal-50/40 p-5 ${
        schedule ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""
      }`}
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-teal-700" />
          <p className="text-sm font-bold text-slate-800">{t("title")}</p>
          <InfoTooltip content={t("hint")} />
        </div>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={t("codePlaceholder")}
          autoComplete="off"
          autoFocus
          className={`${INPUT} font-mono`}
        />
        <input
          value={staffNotes}
          onChange={(event) => setStaffNotes(event.target.value)}
          placeholder={t("notesPlaceholder")}
          maxLength={500}
          className={INPUT}
        />
        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={checkIn.isPending}
          className="w-full bg-teal-600 text-white hover:bg-teal-700"
        >
          {checkIn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("submit")}
        </Button>
      </form>

      {schedule ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {t("resultTitle", { code: schedule.scheduleCode })}
            </p>
            <p className="text-slate-700">
              <span className="font-semibold">{schedule.customerName ?? "—"}</span>
              {" · "}
              {schedule.contractCode ?? "—"}
            </p>
            <p className="text-slate-600">
              {formatScheduleDate(schedule.scheduledDate)} · {schedule.timeSlotSnapshot.slotName} (
              {schedule.timeSlotSnapshot.startTime}–{schedule.timeSlotSnapshot.endTime})
            </p>
            <p className="text-slate-600">
              {t("people", { count: schedule.numberOfPeople })}
              {schedule.vehiclePlate ? ` · ${schedule.vehiclePlate}` : ""}
              {schedule.vehicleType ? ` · ${schedule.vehicleType}` : ""}
            </p>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                {t("racks")}
              </p>
              <ul className="flex flex-wrap gap-2">
                {result.rentedRacks.map((rack) => (
                  <li
                    key={rack.rackId}
                    className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800"
                  >
                    {rack.rackCode}
                    {rack.aisle ? ` · ${t("aisle", { aisle: rack.aisle })}` : ""}
                    {rack.bay !== null && rack.bay !== undefined
                      ? ` · ${t("bay", { bay: String(rack.bay) })}`
                      : ""}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href={`/${locale}/${portalBase}/access-schedules/${schedule.id}`}
              className="inline-block text-sm font-semibold text-teal-700 hover:underline"
            >
              {t("openDetail")}
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
