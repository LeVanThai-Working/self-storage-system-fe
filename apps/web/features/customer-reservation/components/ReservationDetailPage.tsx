"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@self-storage-system-fe/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useReservation, useRespondUnitReassign } from "../hooks";
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
  const respondReassign = useRespondUnitReassign();

  const [cancelling, setCancelling] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

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

  const handleRespond = async (action: "accept" | "reject") => {
    try {
      await respondReassign.mutateAsync({
        id: r.id,
        payload: {
          action,
          rejectReason: action === "reject" ? rejectReason.trim() || undefined : undefined,
        },
      });
      setShowRejectDialog(false);
      setRejectReason("");
      setFeedback({
        type: "success",
        message:
          action === "accept"
            ? t("pendingUnitChange.acceptSuccess")
            : t("pendingUnitChange.rejectSuccess"),
      });
      void refetch();
    } catch {
      setFeedback({
        type: "error",
        message: "Không thể xử lý yêu cầu đổi phòng. Vui lòng thử lại sau.",
      });
    }
  };

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

      {feedback && (
        <div
          className={`mt-4 flex items-center gap-2.5 rounded-2xl border p-4 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="size-5 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Arrived Immunity Notice */}
      {r.arrivedAt && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-900 shadow-sm">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          <p className="font-semibold">{t("arrivedBanner", { time: formatDate(r.arrivedAt) })}</p>
        </div>
      )}

      {/* Pending Unit Change Proposal */}
      {r.pendingUnitChange && (
        <div className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-amber-900">{t("pendingUnitChange.title")}</h3>
              <p className="text-sm text-amber-800">
                {t("pendingUnitChange.body", {
                  unit:
                    r.pendingUnitChange.newStorageUnit?.unitNumber ??
                    r.pendingUnitChange.newStorageUnitId,
                  reason: r.pendingUnitChange.reason,
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/80">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={respondReassign.isPending}
              onClick={() => handleRespond("accept")}
            >
              {respondReassign.isPending ? "Đang xử lý…" : t("pendingUnitChange.accept")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-900 hover:bg-amber-100"
              disabled={respondReassign.isPending}
              onClick={() => setShowRejectDialog(true)}
            >
              {t("pendingUnitChange.reject")}
            </Button>
          </div>
        </div>
      )}

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
          {r.assignedStaff && (
            <Row
              label="Nhân viên đón tiếp"
              value={`${r.assignedStaff.fullName} (${r.assignedStaff.email})`}
            />
          )}
          {Boolean(r.gracePeriodExtendedHours) && (
            <Row label="Gia hạn ân hạn" value={`+${r.gracePeriodExtendedHours} giờ`} />
          )}
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

      {/* Reject Unit Reassignment Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("pendingUnitChange.rejectTitle")}</DialogTitle>
            <DialogDescription>{t("pendingUnitChange.rejectDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-700">
                {t("pendingUnitChange.rejectReason")}
              </span>
              <textarea
                className="min-h-20 w-full resize-y rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                placeholder={t("pendingUnitChange.rejectPlaceholder")}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={respondReassign.isPending}
            >
              {t("pendingUnitChange.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleRespond("reject")}
              disabled={respondReassign.isPending}
            >
              {respondReassign.isPending ? "Đang xử lý…" : t("pendingUnitChange.confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CancelReservationDialog
        reservation={cancelling ? r : null}
        onClose={() => setCancelling(false)}
      />
    </>
  );
}
