"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CalendarClock, MapPin, Package } from "lucide-react";
import { formatCurrency, formatDate } from "@self-storage-system-fe/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMyReservations } from "../hooks";
import { CustomerReservationStatus, type CustomerReservation } from "../types";
import { isAwaitingDeposit, isCancellable } from "../utils";
import { CancelReservationDialog } from "./CancelReservationDialog";
import { ReservationStatusBadge } from "./ReservationStatusBadge";

const PAGE_SIZE = 10;

const STATUS_TABS: Array<CustomerReservationStatus | "all"> = [
  "all",
  CustomerReservationStatus.PENDING_PAYMENT,
  CustomerReservationStatus.PAYMENT_SUCCESSFUL,
  CustomerReservationStatus.CONFIRMED,
  CustomerReservationStatus.OVERDUE,
  CustomerReservationStatus.COMPLETED,
  CustomerReservationStatus.CANCELLED,
  CustomerReservationStatus.EXPIRED,
];

function ReservationCard({
  reservation: r,
  onCancel,
}: {
  reservation: CustomerReservation;
  onCancel: (r: CustomerReservation) => void;
}) {
  const t = useTranslations("customerReservation.list");
  const locale = useLocale();
  const base = `/${locale}/customer/reservations/${r.id}`;

  return (
    <li className="rounded-2xl border border-neutral-border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-muted">{r.reservationCode}</p>
          <h3 className="text-lg font-semibold">{r.facility?.name ?? "—"}</h3>
        </div>
        <ReservationStatusBadge status={r.status} />
      </div>

      <ul className="mt-3 grid gap-2 text-sm text-neutral-muted sm:grid-cols-2">
        <li className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {r.facility ? `${r.facility.address}, ${r.facility.city}` : "—"}
        </li>
        <li className="flex items-center gap-2">
          <Package className="size-4 shrink-0" aria-hidden />
          {r.storageUnit
            ? t("unit", { unit: r.storageUnit.unitNumber, floor: r.storageUnit.floor })
            : "—"}
        </li>
        <li className="flex items-center gap-2">
          <CalendarClock className="size-4 shrink-0" aria-hidden />
          {t("checkIn", { date: formatDate(r.checkInDate), slot: r.checkInTimeSlot })}
        </li>
        <li className="font-semibold text-brand">
          {t("deposit", { amount: formatCurrency(r.depositAmount) })}
        </li>
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={base} className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("details")}
        </Link>
        {isAwaitingDeposit(r) && (
          <Link href={`${base}/payment`} className={buttonVariants({ size: "sm" })}>
            {t("pay")}
          </Link>
        )}
        {isCancellable(r) && (
          <Button size="sm" variant="ghost" onClick={() => onCancel(r)}>
            {t("cancel")}
          </Button>
        )}
      </div>
    </li>
  );
}

export function MyReservationsPage() {
  const t = useTranslations("customerReservation.list");
  const tStatus = useTranslations("customerReservation.status");
  const locale = useLocale();

  const [status, setStatus] = useState<CustomerReservationStatus | "all">("all");
  const [codeDraft, setCodeDraft] = useState("");
  const [code, setCode] = useState("");
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState<CustomerReservation | null>(null);

  const { data, isLoading, isError, refetch } = useMyReservations({
    page,
    limit: PAGE_SIZE,
    status: status === "all" ? undefined : status,
    reservationCode: code,
  });

  const items = data?.items ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setCode(codeDraft);
    setPage(1);
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-neutral-muted">{t("subtitle")}</p>
        </div>
        <Link href={`/${locale}/customer/search`} className={buttonVariants()}>
          {t("bookNew")}
        </Link>
      </div>

      <div
        className="mt-6 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label={t("filterLabel")}
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={status === tab}
            onClick={() => {
              setStatus(tab);
              setPage(1);
            }}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              status === tab
                ? "border-brand bg-brand-bg text-brand"
                : "border-neutral-border bg-white text-neutral-muted hover:text-neutral-main"
            )}
          >
            {tab === "all" ? t("all") : tStatus(tab)}
          </button>
        ))}
      </div>

      <form onSubmit={onSearch} className="mt-4 flex max-w-md gap-2">
        <Input
          value={codeDraft}
          onChange={(e) => setCodeDraft(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
        />
        <Button type="submit" variant="outline">
          {t("search")}
        </Button>
      </form>

      <section className="mt-6" aria-live="polite">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-neutral-border bg-white p-8 text-center">
            <p className="text-neutral-muted">{t("error")}</p>
            <Button className="mt-4" onClick={() => refetch()}>
              {t("retry")}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-neutral-border bg-white p-8 text-center text-neutral-muted">
            {t("empty")}
          </p>
        ) : (
          <>
            <ul className="space-y-4">
              {items.map((r) => (
                <ReservationCard key={r.id} reservation={r} onCancel={setCancelling} />
              ))}
            </ul>
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t("prev")}
                </Button>
                <span className="text-sm text-neutral-muted">
                  {t("pageOf", { page, total: totalPages })}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("next")}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <CancelReservationDialog reservation={cancelling} onClose={() => setCancelling(null)} />
    </>
  );
}
