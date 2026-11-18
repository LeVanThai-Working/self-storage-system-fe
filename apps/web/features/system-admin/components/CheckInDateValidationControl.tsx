"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, CalendarCheck, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionTooltip } from "@/components/ui/tooltip";
import { formatVietnamDateLabel, useCheckInDateValidation } from "../checkInDateValidation";

interface CheckInDateValidationControlProps {
  variant?: "card" | "compact";
}

/**
 * Toggle switch controlling frontend check-in arrival date validation (stored in localStorage).
 * Default is ON so business rules hold during demos; toggle OFF to demo early check-ins.
 */
export function CheckInDateValidationControl({
  variant = "card",
}: CheckInDateValidationControlProps) {
  const t = useTranslations("systemAdmin.checkInDateValidation");
  const { enabled, toggle } = useCheckInDateValidation();

  if (variant === "compact") {
    return (
      <ActionTooltip content={t("description")} side="bottom">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={t("title")}
          onClick={toggle}
          className={`inline-flex items-center gap-2.5 rounded-2xl border px-3.5 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer ${
            enabled
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100/80"
              : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
          }`}
        >
          <CalendarCheck
            className={`size-3.5 shrink-0 ${enabled ? "text-emerald-600" : "text-amber-600"}`}
          />
          <span className="whitespace-nowrap">{t("shortLabel")}:</span>
          <span className="whitespace-nowrap font-extrabold">
            {enabled ? t("enabled") : t("disabled")}
          </span>
          <span
            aria-hidden="true"
            className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
              enabled ? "bg-emerald-600" : "bg-amber-400"
            }`}
          >
            <span
              className={`inline-block size-3 rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-3.5" : "translate-x-0.5"
              }`}
            />
          </span>
        </button>
      </ActionTooltip>
    );
  }

  return (
    <section className="mb-6 rounded-xl border border-neutral-border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <CalendarCheck className="size-5 shrink-0 text-teal-700" />
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t("description")}</p>
        </div>
        <Button
          type="button"
          role="switch"
          aria-label={t("title")}
          aria-checked={enabled}
          variant={enabled ? "default" : "outline"}
          onClick={toggle}
          className={
            enabled
              ? ""
              : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
          }
        >
          {enabled ? t("enabled") : t("disabled")}
        </Button>
      </div>
      {!enabled ? (
        <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          {t("demoNotice")}
        </p>
      ) : null}
    </section>
  );
}

/**
 * Compact status banner shown on operational screens while check-in date validation is disabled for demos.
 */
export function CheckInDateDemoBanner({ className = "" }: { className?: string }) {
  const t = useTranslations("systemAdmin.checkInDateValidation");
  const { enabled, setEnabled } = useCheckInDateValidation();

  if (enabled) return null;

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs text-amber-900 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <CalendarClock className="size-4 shrink-0 text-amber-600" />
        <span className="font-semibold">{t("demoNotice")}</span>
      </div>
      <button
        type="button"
        onClick={() => setEnabled(true)}
        className="shrink-0 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
      >
        {t("reEnable")}
      </button>
    </div>
  );
}

/**
 * Inline alert explaining that the scheduled check-in / contract start date has not arrived yet.
 */
export function CheckInDateBlockedBanner({
  scheduledDate,
  target,
  className = "",
}: {
  scheduledDate?: string | null;
  target: "reservation" | "contract";
  className?: string;
}) {
  const t = useTranslations("systemAdmin.checkInDateValidation");
  const formattedDate = formatVietnamDateLabel(scheduledDate);

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 ${className}`}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <span className="font-medium">
        {target === "reservation"
          ? t("blockedReservation", { date: formattedDate })
          : t("blockedContract", { date: formattedDate })}
      </span>
    </div>
  );
}
