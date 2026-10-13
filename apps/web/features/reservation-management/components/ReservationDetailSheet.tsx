"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  Boxes,
  Calendar,
  Check,
  Clock,
  CreditCard,
  FileCheck2,
  Inbox,
  Layers,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useReservationDetail } from "../hooks";
import {
  BillingUnitEnum,
  ReservationStatusEnum,
  type FacilityUnitTypeOfferingResponse,
  type ReservationResponse,
} from "../types";
import {
  buildReservationTimelineSteps,
  formatDateOnly,
  formatDateTime,
  formatRentalScheduleLabel,
  formatVnd,
} from "../utils";
import { ReservationStatusBadge } from "./ReservationStatusBadge";

interface ReservationDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
  offerings: FacilityUnitTypeOfferingResponse[];
  nowMs: number;
  onReceive: (reservation: ReservationResponse) => void;
  onOpenAssignUnit: (reservation: ReservationResponse) => void;
  onOpenReject: (reservation: ReservationResponse) => void;
  onOpenConfirm: (reservation: ReservationResponse) => void;
  onOpenCancel: (reservation: ReservationResponse) => void;
  onOpenManualPayment: (reservation: ReservationResponse) => void;
  onOpenCreateContract: (reservation: ReservationResponse) => void;
  onComplete: (reservation: ReservationResponse) => void;
  isReceiving?: boolean;
  isCompleting?: boolean;
}

export const ReservationDetailSheet: React.FC<ReservationDetailSheetProps> = ({
  isOpen,
  onClose,
  reservation: initialReservation,
  offerings,
  nowMs,
  onReceive,
  onOpenAssignUnit,
  onOpenReject,
  onOpenConfirm,
  onOpenCancel,
  onOpenManualPayment,
  onOpenCreateContract,
  onComplete,
  isReceiving = false,
  isCompleting = false,
}) => {
  const t = useTranslations("facilityManager.reservations.detailSheet");
  const tActions = useTranslations("facilityManager.reservations.actions");
  const tBilling = useTranslations("facilityManager.reservations.billingUnit");
  const tStorageUnitStatus = useTranslations("storageUnitStatus");
  const locale = useLocale() === "en" ? "en" : "vi";

  const detailQuery = useReservationDetail(isOpen ? (initialReservation?.id ?? null) : null);
  const reservation = detailQuery.data ?? initialReservation;

  if (!reservation) return null;

  const offering = offerings.find(
    (o) =>
      o.id === reservation.facilityUnitTypeOfferingId ||
      (reservation.offering?.unitTypeId && o.unitType.id === reservation.offering.unitTypeId)
  );

  const timelineSteps = buildReservationTimelineSteps(reservation, locale);
  const status = reservation.status;

  const canReceive = status === ReservationStatusEnum.PENDING;
  const canAssignUnit =
    status === ReservationStatusEnum.PENDING || status === ReservationStatusEnum.RECEIVED;
  const canReject =
    status === ReservationStatusEnum.PENDING || status === ReservationStatusEnum.RECEIVED;
  const canManualPayment =
    status === ReservationStatusEnum.PENDING_PAYMENT ||
    status === ReservationStatusEnum.PAYMENT_FAILED;
  const canConfirm = status === ReservationStatusEnum.PAYMENT_SUCCESSFUL;
  const canCreateContract =
    status === ReservationStatusEnum.CONFIRMED && Boolean(reservation.storageUnitId);
  const canComplete = status === ReservationStatusEnum.CONFIRMED;
  const canCancel =
    status === ReservationStatusEnum.PENDING ||
    status === ReservationStatusEnum.RECEIVED ||
    status === ReservationStatusEnum.PENDING_PAYMENT ||
    status === ReservationStatusEnum.PAYMENT_FAILED ||
    status === ReservationStatusEnum.PAYMENT_SUCCESSFUL ||
    status === ReservationStatusEnum.CONFIRMED;

  // Calculate base storage subtotal
  const durationMultiplier =
    reservation.billingUnit === BillingUnitEnum.MONTH
      ? Math.max(1, reservation.rentalDuration / 30)
      : reservation.billingUnit === BillingUnitEnum.DAY
        ? reservation.rentalDuration
        : 1;
  const baseStorageTotal = Math.round(reservation.basePrice * durationMultiplier);

  const getLocalizedUnitStatus = (unitStatus?: string | null) => {
    if (!unitStatus) return "—";
    const normalized = unitStatus.toLowerCase();
    if (
      normalized === "available" ||
      normalized === "reserved" ||
      normalized === "occupied" ||
      normalized === "under_maintenance" ||
      normalized === "inactive"
    ) {
      return tStorageUnitStatus(normalized);
    }
    return unitStatus;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="!w-full sm:!max-w-2xl lg:!max-w-4xl xl:!max-w-[900px] data-[side=right]:!w-full data-[side=right]:sm:!max-w-2xl data-[side=right]:lg:!max-w-4xl data-[side=right]:xl:!max-w-[900px] p-0 flex flex-col bg-white border-l border-slate-100 shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="px-6 sm:px-8 py-5 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-sm font-extrabold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  {reservation.reservationCode}
                </span>
                <ReservationStatusBadge
                  status={reservation.status}
                  expiresAt={reservation.expiresAt}
                  nowMs={nowMs}
                  showCountdown
                />
                <button
                  type="button"
                  onClick={() => detailQuery.refetch()}
                  disabled={detailQuery.isFetching}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition-colors"
                  title={t("refresh")}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${detailQuery.isFetching ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
              <SheetTitle className="text-xl font-extrabold text-slate-900 mt-2">
                {t("title")}
              </SheetTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("createdAt")}: {formatDateTime(reservation.createdAt, locale)}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
          {/* Terminal Alert Banner (Rejected / Cancelled / Expired) */}
          {status === ReservationStatusEnum.REJECTED && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 space-y-1.5 text-xs text-rose-800">
              <div className="flex items-center gap-2 font-extrabold text-sm text-rose-900">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                {t("terminal.rejectedTitle")}
              </div>
              {reservation.rejectionReason && (
                <p className="break-words">
                  <span className="font-bold">{t("terminal.reason")}:</span>{" "}
                  {reservation.rejectionReason}
                </p>
              )}
              <p className="text-rose-600/90">{formatDateTime(reservation.updatedAt, locale)}</p>
            </div>
          )}

          {status === ReservationStatusEnum.CANCELLED && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 space-y-1.5 text-xs text-rose-800">
              <div className="flex items-center gap-2 font-extrabold text-sm text-rose-900">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                {t("terminal.cancelledTitle")}
              </div>
              {reservation.cancellationReason && (
                <p className="break-words">
                  <span className="font-bold">{t("terminal.reason")}:</span>{" "}
                  {reservation.cancellationReason}
                </p>
              )}
              <p className="text-rose-600/90">
                {reservation.cancelledBy?.name ? `${reservation.cancelledBy.name} • ` : ""}
                {formatDateTime(reservation.cancelledAt, locale)}
              </p>
              {reservation.refundAmount > 0 && (
                <p className="font-bold text-emerald-700 pt-1">
                  {t("terminal.refundAmount")}: {formatVnd(reservation.refundAmount)}
                </p>
              )}
            </div>
          )}

          {status === ReservationStatusEnum.EXPIRED && (
            <div className="rounded-2xl bg-slate-100 border border-slate-200 p-4 space-y-1 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                {t("terminal.expiredTitle")}
              </div>
              <p>
                {t("terminal.expiredAt")}: {formatDateTime(reservation.expiresAt, locale)}
              </p>
            </div>
          )}

          {/* 6-Step Progress Timeline Stepper */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              {t("timelineTitle")}
            </h3>

            <div className="space-y-3.5">
              {timelineSteps.map((step, idx) => {
                const isLast = idx === timelineSteps.length - 1;
                const isCompleted = step.state === "completed";
                const isCurrent = step.state === "current";
                const isError = step.state === "error";

                const stepBadgeClass = isCompleted
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isError
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : isCurrent
                      ? "bg-teal-50 text-teal-700 border-teal-200"
                      : "bg-slate-100 text-slate-500 border-slate-200";

                return (
                  <div key={step.key} className="flex items-start gap-3.5 relative">
                    {!isLast && (
                      <div
                        className={`w-0.5 absolute left-3.5 top-7 bottom-[-14px] ${
                          isCompleted ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                      />
                    )}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 z-10 ${
                        isCompleted
                          ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                          : isError
                            ? "bg-rose-600 text-white"
                            : isCurrent
                              ? "bg-teal-50 text-teal-700 border-2 border-teal-500"
                              : "bg-white text-slate-400 border border-slate-200"
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.stepNumber}
                    </div>

                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <p
                            className={`text-xs sm:text-sm font-bold ${
                              isCompleted || isCurrent || isError
                                ? "text-slate-900"
                                : "text-slate-400"
                            }`}
                          >
                            {t(`steps.${step.key}`)}
                          </p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${stepBadgeClass}`}
                          >
                            {t(`stepStates.${step.state}`)}
                          </span>
                        </div>
                        {step.timestamp && (
                          <span className="text-xs font-medium text-slate-500 shrink-0">
                            {formatDateTime(step.timestamp, locale)}
                          </span>
                        )}
                      </div>

                      {(step.actorName || step.metaText) && (
                        <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-slate-500">
                          {step.actorName && <span>{step.actorName}</span>}
                          {step.metaText && (
                            <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/70">
                              {step.metaText}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Contact Info */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              {t("customerTitle")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-400 font-semibold">{t("customerName")}</p>
                <p className="font-bold text-slate-900 mt-1 text-sm break-words">
                  {reservation.customer?.name ?? "—"}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-400 font-semibold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {t("customerPhone")}
                </p>
                <p className="font-bold text-slate-900 mt-1 text-sm break-words">
                  {reservation.customer?.phoneNumber || "—"}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-400 font-semibold flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {t("customerEmail")}
                </p>
                <p className="font-bold text-slate-900 mt-1 text-sm break-all">
                  {reservation.customer?.email || "—"}
                </p>
              </div>
            </div>

            {reservation.notes && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs">
                <p className="font-bold text-amber-900">{t("notesLabel")}:</p>
                <p className="text-amber-800 mt-1 break-words leading-relaxed">
                  {reservation.notes}
                </p>
              </div>
            )}
          </div>

          {/* Assigned Storage Unit & Rental Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-600" />
                {t("assignedUnitTitle")}
              </h3>

              {reservation.storageUnit ? (
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-mono text-base font-extrabold text-emerald-900">
                      {reservation.storageUnit.unitNumber}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                      {getLocalizedUnitStatus(reservation.storageUnit.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-emerald-800 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {t("floorLabel", { floor: reservation.storageUnit.floor })}
                    </span>
                    {reservation.storageUnit.zone && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {t("zoneLabel", { zone: reservation.storageUnit.zone })}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                  {t("unassignedUnitText")}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 text-xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                {t("scheduleTitle")}
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 shrink-0">{t("unitTypeLabel")}</span>
                  <span className="font-bold text-slate-900 text-right">
                    {offering?.unitType.name ?? t("standardOffering")}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 shrink-0">{t("startDateLabel")}</span>
                  <span className="font-bold text-slate-900 text-right">
                    {formatDateOnly(reservation.startDate, locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 shrink-0">{t("durationLabel")}</span>
                  <span className="font-bold text-slate-900 text-right">
                    {formatRentalScheduleLabel(
                      reservation.rentalDuration,
                      reservation.billingUnit,
                      locale
                    )}
                  </span>
                </div>
                {reservation.expiresAt && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500 shrink-0">{t("holdExpiresAtLabel")}</span>
                    <span className="font-bold text-amber-700 text-right">
                      {formatDateTime(reservation.expiresAt, locale)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amenities & Financial Breakdown */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              {t("financialTitle")}
            </h3>

            <div className="space-y-3 text-xs">
              {/* Storage Package Row */}
              <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-100">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm">
                    {offering?.unitType.name ?? t("storageRentalRow")}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatVnd(reservation.basePrice)} / {tBilling(reservation.billingUnit)} •{" "}
                    {formatRentalScheduleLabel(
                      reservation.rentalDuration,
                      reservation.billingUnit,
                      locale
                    )}
                  </p>
                </div>
                <span className="font-bold text-slate-900 text-sm shrink-0">
                  {formatVnd(baseStorageTotal)}
                </span>
              </div>

              {/* Amenities Rows */}
              {reservation.amenities?.length > 0 && (
                <div className="space-y-2.5 py-1.5 border-b border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t("amenitiesHeader")} ({reservation.amenities.length})
                  </p>
                  {reservation.amenities.map((am) => {
                    const amMult =
                      am.billingUnit === BillingUnitEnum.MONTH
                        ? Math.max(1, reservation.rentalDuration / 30)
                        : am.billingUnit === BillingUnitEnum.DAY
                          ? reservation.rentalDuration
                          : 1;
                    const lineTotal = Math.round(am.pricePerUnit * am.quantity * amMult);
                    return (
                      <div key={am.amenityId} className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800">{am.name}</span>{" "}
                          <span className="text-slate-500">
                            × {am.quantity} ({formatVnd(am.pricePerUnit)}/{tBilling(am.billingUnit)}
                            )
                          </span>
                        </div>
                        <span className="font-bold text-slate-800 shrink-0">
                          {formatVnd(lineTotal)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Totals */}
              <div className="pt-2 space-y-2.5">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-bold text-slate-600">{t("totalAmountLabel")}</span>
                  <span className="font-extrabold text-slate-900">
                    {formatVnd(reservation.totalAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                  <div className="min-w-0">
                    <p className="font-extrabold text-emerald-900 text-sm">
                      {t("depositRequiredLabel")}
                    </p>
                    {(reservation.paidAmount ?? 0) > 0 && (
                      <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                        {t("paidDepositText")}: {formatVnd(reservation.paidAmount)}
                        {reservation.paidAt
                          ? ` (${formatDateTime(reservation.paidAt, locale)})`
                          : ""}
                      </p>
                    )}
                  </div>
                  <span className="text-lg font-extrabold text-emerald-700 shrink-0">
                    {formatVnd(reservation.depositAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contextual Footer Actions */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors"
          >
            {t("close")}
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {canReceive && (
              <button
                type="button"
                onClick={() => onReceive(reservation)}
                disabled={isReceiving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 shadow-sm disabled:opacity-50"
              >
                <Inbox className="w-3.5 h-3.5" />
                {tActions("receive")}
              </button>
            )}

            {canAssignUnit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAssignUnit(reservation);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              >
                <Boxes className="w-3.5 h-3.5" />
                {tActions("assignUnit")}
              </button>
            )}

            {canManualPayment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenManualPayment(reservation);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" />
                {tActions("verifyPayment")}
              </button>
            )}

            {canConfirm && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenConfirm(reservation);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {tActions("confirmOrder")}
              </button>
            )}

            {canCreateContract && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateContract(reservation);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                {tActions("createContract")}
              </button>
            )}

            {canComplete && !canCreateContract && (
              <button
                type="button"
                onClick={() => onComplete(reservation)}
                disabled={isCompleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                {tActions("completeHandover")}
              </button>
            )}

            {canReject && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReject(reservation);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
              >
                <XCircle className="w-3.5 h-3.5" />
                {tActions("reject")}
              </button>
            )}

            {canCancel && !canReject && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCancel(reservation);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
              >
                <XCircle className="w-3.5 h-3.5" />
                {tActions("cancel")}
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
