"use client";

import React, { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Boxes,
  CheckCircle2,
  CreditCard,
  QrCode,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApiErrorMessage } from "@/features/auth/error-message";
import {
  useCancelReservation,
  useConfirmManualPayment,
  useConfirmReservation,
  useCreateOrGetReservationDepositPayment,
  useRejectReservation,
} from "../hooks";
import {
  MESSAGE_CODE,
  PaymentMethodEnum,
  PaymentStatusEnum,
  ReservationStatusEnum,
  cancelReservationSchema,
  confirmManualPaymentSchema,
  confirmReservationSchema,
  rejectReservationSchema,
  type PaymentResponse,
  type ReservationResponse,
} from "../types";
import { formatDateOnly, formatDateTime, formatVnd } from "../utils";

/* ============================================================================
 * 5.1. RejectReservationModal (POST /reservations/{id}/reject)
 * ========================================================================== */
interface RejectReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
}

export const RejectReservationModal: React.FC<RejectReservationModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const t = useTranslations("facilityManager.reservations.rejectModal");
  const tErrors = useTranslations("facilityManager.reservations.errors");
  const getErrorMessage = useApiErrorMessage();
  const rejectMutation = useRejectReservation();

  const [rejectionReason, setRejectionReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!reservation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = rejectReservationSchema.safeParse({
      rejectionReason: rejectionReason.trim(),
    });
    if (!parsed.success) {
      setErrorMsg(t("validationReason"));
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: reservation.id,
        payload: parsed.data,
      });
      setSuccessMsg(t("success"));
      setTimeout(onClose, 800);
    } catch (err: unknown) {
      setErrorMsg(
        getErrorMessage(err, {
          [MESSAGE_CODE.MESSAGE_CODE_301]: tErrors("statusChanged"),
        })
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !rejectMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {t("title")} • {reservation.reservationCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5 text-xs text-slate-600 space-y-1">
            <p>
              <span className="font-bold text-slate-800">{t("customerLabel")}:</span>{" "}
              {reservation.customer?.name ?? "—"} ({reservation.customer?.phoneNumber || "—"})
            </p>
            <p>
              <span className="font-bold text-slate-800">{t("depositLabel")}:</span>{" "}
              {formatVnd(reservation.depositAmount)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t("reasonLabel")} *
            </label>
            <textarea
              rows={4}
              maxLength={500}
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={t("reasonPlaceholder")}
              className="w-full bg-slate-50 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none resize-none"
            />
            <p className="text-[11px] text-slate-400 text-right mt-1">
              {rejectionReason.trim().length}/500
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={rejectMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={rejectMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm disabled:opacity-50"
            >
              {rejectMutation.isPending ? t("submitting") : t("confirmBtn")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 5.2. ConfirmReservationModal (POST /reservations/{id}/confirm)
 * ========================================================================== */
interface ConfirmReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
}

export const ConfirmReservationModal: React.FC<ConfirmReservationModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const t = useTranslations("facilityManager.reservations.confirmModal");
  const tErrors = useTranslations("facilityManager.reservations.errors");
  const locale = useLocale() === "en" ? "en" : "vi";
  const getErrorMessage = useApiErrorMessage();
  const confirmMutation = useConfirmReservation();

  const [notes, setNotes] = useState<string>(reservation?.notes ?? "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!reservation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = confirmReservationSchema.safeParse({
      notes: notes.trim() ? notes.trim() : undefined,
    });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? t("validationError"));
      return;
    }

    try {
      await confirmMutation.mutateAsync({
        id: reservation.id,
        payload: parsed.data,
      });
      setSuccessMsg(t("success"));
      setTimeout(onClose, 800);
    } catch (err: unknown) {
      setErrorMsg(
        getErrorMessage(err, {
          [MESSAGE_CODE.MESSAGE_CODE_301]: tErrors("statusChanged"),
        })
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !confirmMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {t("title")} • {reservation.reservationCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t("customerLabel")}</span>
              <span className="font-bold text-slate-900">
                {reservation.customer?.name ?? "—"} ({reservation.customer?.phoneNumber || "—"})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t("assignedUnitLabel")}</span>
              <span className="font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                {reservation.storageUnit?.unitNumber ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t("paidDepositLabel")}</span>
              <span className="font-extrabold text-teal-700">
                {formatVnd(reservation.paidAmount || reservation.depositAmount)}
              </span>
            </div>
            {reservation.paidAt && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t("paidAtLabel")}</span>
                <span className="font-medium text-slate-700">
                  {formatDateTime(reservation.paidAt, locale)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t("startDateLabel")}</span>
              <span className="font-bold text-slate-800">
                {formatDateOnly(reservation.startDate, locale)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t("notesLabel")}
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              className="w-full bg-slate-50 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={confirmMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={confirmMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              {confirmMutation.isPending ? t("submitting") : t("confirmBtn")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 5.3. CancelReservationModal (POST /reservations/{id}/cancel)
 * ========================================================================== */
interface CancelReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
}

export const CancelReservationModal: React.FC<CancelReservationModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const t = useTranslations("facilityManager.reservations.cancelModal");
  const tErrors = useTranslations("facilityManager.reservations.errors");
  const getErrorMessage = useApiErrorMessage();
  const cancelMutation = useCancelReservation();

  const [cancellationReason, setCancellationReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!reservation) return null;

  const isPaymentSuccessful = reservation.status === ReservationStatusEnum.PAYMENT_SUCCESSFUL;
  const isConfirmed = reservation.status === ReservationStatusEnum.CONFIRMED;
  const expectedRefundAmount = isPaymentSuccessful ? reservation.depositAmount : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = cancelReservationSchema.safeParse({
      cancellationReason: cancellationReason.trim(),
    });
    if (!parsed.success) {
      setErrorMsg(t("validationReason"));
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        id: reservation.id,
        payload: parsed.data,
      });
      setSuccessMsg(t("success"));
      setTimeout(onClose, 800);
    } catch (err: unknown) {
      setErrorMsg(
        getErrorMessage(err, {
          [MESSAGE_CODE.MESSAGE_CODE_301]: tErrors("statusChanged"),
          [MESSAGE_CODE.MESSAGE_CODE_303]: tErrors("cannotCancel"),
        })
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !cancelMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-amber-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {t("title")} • {reservation.reservationCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Impact Notice */}
          <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-4 space-y-2 text-xs text-amber-900">
            <p className="font-extrabold flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-amber-600" />
              {t("impactTitle")}
            </p>
            {reservation.storageUnit?.unitNumber && (
              <p>• {t("releaseUnitNotice", { unitNumber: reservation.storageUnit.unitNumber })}</p>
            )}
            {reservation.amenities?.length > 0 && (
              <p>• {t("restoreAmenitiesNotice", { count: reservation.amenities.length })}</p>
            )}
            {isPaymentSuccessful && (
              <p className="font-bold text-emerald-800">
                • {t("refundFullNotice", { amount: formatVnd(expectedRefundAmount) })}
              </p>
            )}
            {isConfirmed && (
              <p className="font-bold text-rose-700">• {t("refundZeroConfirmedNotice")}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t("reasonLabel")} *
            </label>
            <textarea
              rows={4}
              maxLength={500}
              value={cancellationReason}
              onChange={(e) => {
                setCancellationReason(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={t("reasonPlaceholder")}
              className="w-full bg-slate-50 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none"
            />
            <p className="text-[11px] text-slate-400 text-right mt-1">
              {cancellationReason.trim().length}/500
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={cancelMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {t("back")}
            </button>
            <button
              type="submit"
              disabled={cancelMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm disabled:opacity-50"
            >
              {cancelMutation.isPending ? t("submitting") : t("confirmBtn")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 5.4. ManualPaymentConfirmModal (POST /payments + POST /payments/{id}/confirm-manual)
 * ========================================================================== */
interface ManualPaymentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
}

export const ManualPaymentConfirmModal: React.FC<ManualPaymentConfirmModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const t = useTranslations("facilityManager.reservations.manualPaymentModal");
  const locale = useLocale() === "en" ? "en" : "vi";
  const getErrorMessage = useApiErrorMessage();

  const initPaymentMutation = useCreateOrGetReservationDepositPayment();
  const confirmManualMutation = useConfirmManualPayment();

  const paymentSession: PaymentResponse | null = initPaymentMutation.data ?? null;
  const initError: string | null = initPaymentMutation.isError
    ? getErrorMessage(initPaymentMutation.error)
    : null;

  const [method, setMethod] = useState<PaymentMethodEnum.CASH | PaymentMethodEnum.BANK_TRANSFER>(
    PaymentMethodEnum.CASH
  );
  const [referenceCode, setReferenceCode] = useState("");
  const [note, setNote] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCloseModal = () => {
    setSubmitError(null);
    setSuccessMsg(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !reservation?.id) return;
    initPaymentMutation.mutate(reservation.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reservation?.id]);

  if (!reservation) return null;

  const isPending = initPaymentMutation.isPending || confirmManualMutation.isPending;

  const handleConfirmManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!paymentSession?.id) {
      setSubmitError(t("noPaymentSessionError"));
      return;
    }

    const parsed = confirmManualPaymentSchema.safeParse({
      method,
      referenceCode: referenceCode.trim() ? referenceCode.trim() : undefined,
      note: note.trim(),
    });

    if (!parsed.success) {
      setSubmitError(t("validationNoteRequired"));
      return;
    }

    try {
      await confirmManualMutation.mutateAsync({
        paymentId: paymentSession.id,
        payload: parsed.data,
      });
      setSuccessMsg(t("success"));
      setTimeout(handleCloseModal, 900);
    } catch (err: unknown) {
      setSubmitError(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && handleCloseModal()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0 rounded-3xl border-slate-100 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {t("title")} • {reservation.reservationCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {initPaymentMutation.isPending ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">{t("loadingSession")}</p>
            </div>
          ) : initError ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{initError}</span>
            </div>
          ) : paymentSession ? (
            <>
              {/* Active VietQR & Bank Transfer Session Info */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 rounded-2xl border border-slate-200/80 p-4">
                <div className="md:col-span-2 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/70 p-3">
                  {paymentSession.qrUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={paymentSession.qrUrl}
                      alt={paymentSession.paymentCode}
                      className="w-40 h-40 object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-400">
                      VietQR
                    </div>
                  )}
                  <span className="mt-2 font-mono text-[11px] font-bold text-slate-600">
                    {paymentSession.paymentCode}
                  </span>
                </div>

                <div className="md:col-span-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("depositAmountLabel")}</span>
                    <span className="text-base font-extrabold text-emerald-700">
                      {formatVnd(paymentSession.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("bankLabel")}</span>
                    <span className="font-bold text-slate-800">
                      {paymentSession.bankInfo?.bankCode || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("accountNumberLabel")}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {paymentSession.bankInfo?.accountNumber || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("accountHolderLabel")}</span>
                    <span className="font-bold text-slate-800">
                      {paymentSession.bankInfo?.accountName || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("transferContentLabel")}</span>
                    <span className="font-mono font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {paymentSession.paymentCode}
                    </span>
                  </div>
                  {paymentSession.expiresAt && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                      <span className="text-slate-500">{t("qrExpiresAtLabel")}</span>
                      <span className="font-semibold text-slate-700">
                        {formatDateTime(paymentSession.expiresAt, locale)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Payment Confirmation Form */}
              {paymentSession.status === PaymentStatusEnum.PENDING && (
                <form onSubmit={handleConfirmManual} className="space-y-4 pt-2">
                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                      {t("manualSectionTitle")}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{t("manualSectionDesc")}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMethod(PaymentMethodEnum.CASH)}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        method === PaymentMethodEnum.CASH
                          ? "border-emerald-600 bg-emerald-50/80 text-emerald-800 ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      {t("methodCash")}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod(PaymentMethodEnum.BANK_TRANSFER)}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        method === PaymentMethodEnum.BANK_TRANSFER
                          ? "border-emerald-600 bg-emerald-50/80 text-emerald-800 ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      {t("methodBankTransfer")}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {t("referenceCodeLabel")}
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      value={referenceCode}
                      onChange={(e) => setReferenceCode(e.target.value)}
                      placeholder={t("referenceCodePlaceholder")}
                      className="w-full bg-slate-50 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {t("noteLabel")} *
                    </label>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={note}
                      onChange={(e) => {
                        setNote(e.target.value);
                        setSubmitError(null);
                      }}
                      placeholder={t("notePlaceholder")}
                      className="w-full bg-slate-50 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-teal-500 outline-none resize-none"
                    />
                  </div>

                  {submitError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isPending}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      {t("close")}
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                    >
                      {confirmManualMutation.isPending ? t("submitting") : t("confirmBtn")}
                    </button>
                  </DialogFooter>
                </form>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
