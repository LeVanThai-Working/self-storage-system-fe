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
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setReason("");
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!reservation) return;
    setError(null);
    try {
      await cancel.mutateAsync({ id: reservation.id, reason });
      close();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const outcome = reservation ? cancelOutcome(reservation) : "free";

  return (
    <Dialog open={Boolean(reservation)} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title", { code: reservation?.reservationCode ?? "" })}</DialogTitle>
          <DialogDescription>
            {t(`outcome.${outcome}`, {
              amount: formatCurrency(reservation?.depositAmount ?? 0),
            })}
          </DialogDescription>
        </DialogHeader>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("reason")}</span>
          <textarea
            className="min-h-24 w-full resize-y rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
            maxLength={500}
            placeholder={t("reasonPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

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
