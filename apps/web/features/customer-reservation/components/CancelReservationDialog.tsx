"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useCancelReservation } from "../hooks";
import type { CustomerReservation } from "../types";
import { cancelOutcome } from "../utils";

const MIN_REASON_LENGTH = 3;

export function CancelReservationDialog({
  reservation,
  onClose,
}: {
  /** The reservation being cancelled; `null` keeps the dialog closed. */
  reservation: CustomerReservation | null;
  onClose: () => void;
}) {
  const t = useTranslations("customerReservation.cancel");
  const getErrorMessage = useApiErrorMessage();
  const cancel = useCancelReservation();

  const [reason, setReason] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setReason("");
    setBankName("");
    setAccountNumber("");
    setAccountHolder("");
    setError(null);
    onClose();
  };

  const outcome = reservation ? cancelOutcome(reservation) : "free";

  const submit = async () => {
    if (!reservation) return;
    setError(null);
    try {
      await cancel.mutateAsync({
        id: reservation.id,
        payload: {
          cancellationReason: reason.trim(),
          refundBankName: bankName.trim() || undefined,
          refundAccountNumber: accountNumber.trim() || undefined,
          refundAccountHolder: accountHolder.trim().toUpperCase() || undefined,
        },
      });
      close();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={Boolean(reservation)} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title", { code: reservation?.reservationCode ?? "" })}</DialogTitle>
          <DialogDescription>
            {t(`outcome.${outcome}`, {
              amount: formatCurrency(reservation?.depositAmount ?? 0),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{t("reason")} *</span>
            <textarea
              className="min-h-20 w-full resize-y rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
              maxLength={500}
              placeholder={t("reasonPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>

          {outcome === "refund" && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <span className="text-xs font-semibold text-slate-700 block">{t("bankSection")}</span>
              <div className="space-y-2">
                <label className="block space-y-1">
                  <span className="text-xs text-slate-500">{t("bankName")}</span>
                  <Input
                    className="h-9 text-xs"
                    placeholder={t("bankNamePlaceholder")}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <span className="text-xs text-slate-500">{t("accountNumber")}</span>
                    <Input
                      className="h-9 text-xs"
                      placeholder={t("accountNumberPlaceholder")}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-slate-500">{t("accountHolder")}</span>
                    <Input
                      className="h-9 text-xs"
                      placeholder={t("accountHolderPlaceholder")}
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={cancel.isPending}>
            {t("keep")}
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={cancel.isPending || reason.trim().length < MIN_REASON_LENGTH}
          >
            {cancel.isPending ? t("cancelling") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
