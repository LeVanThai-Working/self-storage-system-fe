"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { PaymentStatusEnum, formatCurrency } from "@self-storage-system-fe/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useDepositPayment, useReservation } from "../hooks";
import { CustomerReservationStatus } from "../types";
import { formatCountdown, isAwaitingDeposit, secondsUntil } from "../utils";

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-neutral-border bg-white p-6 text-center">
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-neutral-muted">{label}</dt>
      <dd className="text-right font-semibold break-all">{value}</dd>
    </div>
  );
}

/** Seconds left on the 15-minute hold, re-read every second. */
function useCountdown(expiresAt?: string | null) {
  const [seconds, setSeconds] = useState(() => (expiresAt ? secondsUntil(expiresAt) : 0));
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setSeconds(secondsUntil(expiresAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  return seconds;
}

export function ReservationPaymentPage({ id }: { id: string }) {
  const t = useTranslations("customerReservation.payment");
  const locale = useLocale();
  const getErrorMessage = useApiErrorMessage();
  const reservation = useReservation(id);
  const r = reservation.data;

  const awaiting = r ? isAwaitingDeposit(r) : false;
  const { payment, isLoading: paymentLoading, error, refetch } = useDepositPayment(id, awaiting);
  const secondsLeft = useCountdown(r?.expiresAt);

  // When the hold runs out, ask the BE for the real status (it expires the order in the background).
  const holdRanOut = awaiting && secondsLeft === 0 && Boolean(r?.expiresAt);
  const refetchReservation = reservation.refetch;
  useEffect(() => {
    if (holdRanOut) void refetchReservation();
  }, [holdRanOut, refetchReservation]);

  const detailHref = `/${locale}/customer/reservations/${id}`;
  const listHref = `/${locale}/customer/reservations`;

  if (reservation.isLoading) return <Skeleton className="mx-auto h-96 max-w-xl rounded-2xl" />;

  if (reservation.isError || !r) {
    return (
      <Panel>
        <p className="text-neutral-muted">{t("loadError")}</p>
        <Button className="mt-4" onClick={() => reservation.refetch()}>
          {t("retry")}
        </Button>
      </Panel>
    );
  }

  const paid =
    r.status === CustomerReservationStatus.PAYMENT_SUCCESSFUL ||
    r.status === CustomerReservationStatus.CONFIRMED ||
    r.status === CustomerReservationStatus.COMPLETED ||
    payment?.status === PaymentStatusEnum.PAID;

  if (paid) {
    return (
      <Panel>
        <CheckCircle2 className="mx-auto size-14 text-emerald-600" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">{t("paid.title")}</h1>
        <p className="mt-2 text-neutral-muted">{t("paid.body", { code: r.reservationCode })}</p>
        <Link href={detailHref} className={cn(buttonVariants(), "mt-6")}>
          {t("viewReservation")}
        </Link>
      </Panel>
    );
  }

  if (!awaiting) {
    const cancelled = r.status === CustomerReservationStatus.CANCELLED;
    return (
      <Panel>
        <XCircle className="mx-auto size-14 text-rose-500" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">
          {cancelled ? t("cancelled.title") : t("expired.title")}
        </h1>
        <p className="mt-2 text-neutral-muted">
          {cancelled ? t("cancelled.body") : t("expired.body")}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/${locale}/customer/search`} className={buttonVariants()}>
            {t("bookAgain")}
          </Link>
          <Link href={listHref} className={buttonVariants({ variant: "outline" })}>
            {t("backToList")}
          </Link>
        </div>
      </Panel>
    );
  }

  const remaining = payment ? Math.max(0, payment.amount - payment.paidAmount) : r.depositAmount;
  const partial = payment?.status === PaymentStatusEnum.PARTIALLY_PAID;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-neutral-muted">{t("subtitle", { code: r.reservationCode })}</p>
      </div>

      <div
        role="timer"
        aria-live="off"
        className={cn(
          "flex items-center justify-between rounded-2xl border p-4",
          secondsLeft <= 60
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-amber-200 bg-amber-50 text-amber-800"
        )}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Clock className="size-4" aria-hidden /> {t("holdLeft")}
        </span>
        <span className="text-2xl font-bold tabular-nums">{formatCountdown(secondsLeft)}</span>
      </div>

      <div className="rounded-2xl border border-neutral-border bg-white p-6">
        {paymentLoading && !payment ? (
          <Skeleton className="mx-auto size-64 rounded-xl" />
        ) : error || !payment ? (
          <div className="text-center">
            <p className="text-neutral-muted">
              {error ? getErrorMessage(error) : t("paymentError")}
            </p>
            <Button className="mt-4" onClick={() => refetch()}>
              {t("retry")}
            </Button>
          </div>
        ) : (
          <>
            {payment.qrUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={payment.qrUrl}
                alt={t("qrAlt")}
                className="mx-auto size-64 rounded-xl border border-neutral-border object-contain"
              />
            )}
            <p className="mt-3 text-center text-sm text-neutral-muted">{t("scanHint")}</p>
            <dl className="mt-4 divide-y divide-neutral-border">
              {payment.bankInfo && (
                <>
                  <Row label={t("bank")} value={payment.bankInfo.bankCode} />
                  <Row label={t("accountNumber")} value={payment.bankInfo.accountNumber} />
                  <Row label={t("accountName")} value={payment.bankInfo.accountName} />
                </>
              )}
              <Row label={t("amount")} value={formatCurrency(payment.amount)} />
              <Row label={t("content")} value={payment.paymentCode} />
            </dl>
            {partial && (
              <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                {t("partial", {
                  paid: formatCurrency(payment.paidAmount),
                  remaining: formatCurrency(remaining),
                })}
              </p>
            )}
            <p className="mt-4 text-center text-sm text-neutral-muted" aria-live="polite">
              {t("waiting")}
            </p>
          </>
        )}
      </div>

      <Link href={detailHref} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
        {t("payLater")}
      </Link>
    </div>
  );
}
