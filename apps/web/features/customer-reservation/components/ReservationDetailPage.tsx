"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { formatCurrency, formatDate } from "@self-storage-system-fe/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useReservation } from "../hooks";
import { RefundStatus } from "../types";
import { isAwaitingDeposit, isCancellable } from "../utils";
import { CancelReservationDialog } from "./CancelReservationDialog";
import { ReservationStatusBadge } from "./ReservationStatusBadge";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-neutral-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-border bg-white p-5">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <dl className="divide-y divide-neutral-border">{children}</dl>
    </section>
  );
}

export function ReservationDetailPage({ id }: { id: string }) {
  const t = useTranslations("customerReservation.detail");
  const tBilling = useTranslations("explore.detail.billing");
  const locale = useLocale();
  const { data: r, isLoading, isError, refetch } = useReservation(id);
  const [cancelling, setCancelling] = useState(false);

  const back = (
    <Link
      href={`/${locale}/customer/reservations`}
      className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-muted hover:text-neutral-main"
    >
      <ArrowLeft className="size-4" /> {t("back")}
    </Link>
  );

  if (isLoading) {
    return (
      <>
        {back}
        <Skeleton className="h-96 rounded-2xl" />
      </>
    );
  }

  if (isError || !r) {
    return (
      <>
        {back}
        <div className="rounded-2xl border border-neutral-border bg-white p-8 text-center">
          <p className="text-neutral-muted">{t("error")}</p>
          <Button className="mt-4" onClick={() => refetch()}>
            {t("retry")}
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      {back}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-muted">{t("code")}</p>
          <h1 className="text-3xl font-bold">{r.reservationCode}</h1>
        </div>
        <ReservationStatusBadge status={r.status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {isAwaitingDeposit(r) && (
          <Link
            href={`/${locale}/customer/reservations/${r.id}/payment`}
            className={buttonVariants()}
          >
            {t("pay")}
          </Link>
        )}
        {isCancellable(r) && (
          <Button variant="outline" onClick={() => setCancelling(true)}>
            {t("cancel")}
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={t("sections.facility")}>
          <Row label={t("facility")} value={r.facility?.name ?? "—"} />
          <Row
            label={t("address")}
            value={r.facility ? `${r.facility.address}, ${r.facility.city}` : "—"}
          />
          <Row label={t("phone")} value={r.facility?.phone ?? "—"} />
          <Row
            label={t("unit")}
            value={
              r.storageUnit
                ? t("unitValue", { unit: r.storageUnit.unitNumber, floor: r.storageUnit.floor })
                : "—"
            }
          />
        </Card>

        <Card title={t("sections.schedule")}>
          <Row label={t("checkInDate")} value={formatDate(r.checkInDate)} />
          <Row label={t("checkInSlot")} value={r.checkInTimeSlot} />
          <Row label={t("startDate")} value={formatDate(r.startDate)} />
          <Row label={t("duration")} value={`${r.rentalDuration} ${tBilling(r.billingUnit)}`} />
        </Card>

        <Card title={t("sections.payment")}>
          <Row
            label={t("price")}
            value={`${formatCurrency(r.basePrice)} / ${tBilling(r.billingUnit)}`}
          />
          <Row label={t("deposit")} value={formatCurrency(r.depositAmount)} />
          <Row label={t("paid")} value={formatCurrency(r.paidAmount ?? 0)} />
          {r.paidAt && <Row label={t("paidAt")} value={formatDate(r.paidAt)} />}
          {r.refundStatus !== RefundStatus.NONE && (
            <Row
              label={t("refund")}
              value={`${formatCurrency(r.refundAmount)} · ${t(`refundStatus.${r.refundStatus}`)}`}
            />
          )}
          {r.forfeitedAmount > 0 && (
            <Row label={t("forfeited")} value={formatCurrency(r.forfeitedAmount)} />
          )}
        </Card>

        <Card title={t("sections.more")}>
          <Row label={t("created")} value={formatDate(r.createdAt)} />
          {r.confirmedAt && <Row label={t("confirmedAt")} value={formatDate(r.confirmedAt)} />}
          {r.cancelledAt && <Row label={t("cancelledAt")} value={formatDate(r.cancelledAt)} />}
          {r.cancellationReason && <Row label={t("cancelReason")} value={r.cancellationReason} />}
          {r.notes && <Row label={t("notes")} value={r.notes} />}
        </Card>
      </div>

      {r.amenities.length > 0 && (
        <section className="mt-6 rounded-2xl border border-neutral-border bg-white p-5">
          <h2 className="mb-1 text-lg font-semibold">{t("sections.amenities")}</h2>
          <p className="mb-3 text-sm text-neutral-muted">{t("amenitiesNote")}</p>
          <ul className="divide-y divide-neutral-border text-sm">
            {r.amenities.map((a) => (
              <li key={a.facilityAmenityOfferingId} className="flex justify-between gap-4 py-2">
                <span>
                  {a.name} × {a.quantity}
                </span>
                <span className="text-neutral-muted">
                  {a.pricePerUnit === 0
                    ? t("free")
                    : `${formatCurrency(a.pricePerUnit)} / ${tBilling(a.billingUnit)}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CancelReservationDialog
        reservation={cancelling ? r : null}
        onClose={() => setCancelling(false)}
      />
    </>
  );
}
