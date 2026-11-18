"use client";

import { useTranslations } from "next-intl";
import type { CustomerReservationStatus } from "../types";
import { STATUS_STYLES } from "../utils";

export function ReservationStatusBadge({ status }: { status: CustomerReservationStatus | string }) {
  const t = useTranslations("customerReservation.status");
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap shrink-0 rounded-md border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
    >
      {t.has(status) ? t(status) : status}
    </span>
  );
}
