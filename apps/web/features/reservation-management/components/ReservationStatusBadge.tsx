"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { ReservationStatusEnum } from "../types";
import { formatHoldCountdown, getReservationStatusTone } from "../utils";

interface ReservationStatusBadgeProps {
  status: ReservationStatusEnum;
  expiresAt?: string | null;
  nowMs?: number;
  showCountdown?: boolean;
}

export const ReservationStatusBadge: React.FC<ReservationStatusBadgeProps> = ({
  status,
  expiresAt,
  nowMs,
  showCountdown = false,
}) => {
  const t = useTranslations("facilityManager.reservations.statuses");
  const locale = useLocale() === "en" ? "en" : "vi";
  const tone = getReservationStatusTone(status);

  const shouldShowHoldCountdown =
    showCountdown &&
    (status === ReservationStatusEnum.PENDING_PAYMENT ||
      status === ReservationStatusEnum.PAYMENT_FAILED) &&
    Boolean(expiresAt);

  const countdown = shouldShowHoldCountdown ? formatHoldCountdown(expiresAt, nowMs, locale) : null;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${tone.bg} ${tone.text} ${tone.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
        {t(status)}
      </span>

      {countdown && (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
            countdown.isExpired
              ? "bg-rose-50 text-rose-600 border border-rose-200"
              : countdown.isUrgent
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          <Clock className="w-3 h-3 shrink-0" />
          {countdown.text}
        </span>
      )}
    </div>
  );
};
