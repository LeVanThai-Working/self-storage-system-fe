"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApiErrorMessage } from "@/features/auth/error-message";
import {
  useAvailableStorageUnitsForAssignment,
  useExtendReservationGrace,
  useMarkReservationArrived,
  useReassignReservationUnit,
} from "../hooks";
import type { ReservationResponse } from "../types";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const primaryBtn =
  "inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50";
const ghostBtn =
  "rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50";

interface BaseProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
}

function ModalShell({
  isOpen,
  busy,
  onClose,
  title,
  subtitle,
  children,
}: {
  isOpen: boolean;
  busy: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-3xl border-slate-100 p-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-100 p-6 pb-4">
          <DialogTitle className="text-base font-extrabold text-slate-900">{title}</DialogTitle>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </DialogHeader>
        <div className="space-y-4 p-6 pt-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

function Feedback({ error, success }: { error: string | null; success: string | null }) {
  if (error) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p className="rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700">{success}</p>
    );
  }
  return null;
}

/* ---------------------------------------------------------------------------
 * POST /reservations/{id}/mark-arrived
 * ------------------------------------------------------------------------- */
export const MarkArrivedModal: React.FC<BaseProps> = ({ isOpen, onClose, reservation }) => {
  const t = useTranslations("facilityManager.reservations.flowActions.arrived");
  const getErrorMessage = useApiErrorMessage();
  const mutation = useMarkReservationArrived();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!reservation) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({
        id: reservation.id,
        payload: { notes: notes.trim() || undefined },
      });
      setSuccess(t("success"));
      setTimeout(onClose, 800);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      busy={mutation.isPending}
      onClose={onClose}
      title={t("title")}
      subtitle={t("subtitle", { code: reservation.reservationCode })}
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1.5 text-xs font-bold text-slate-700">
          {t("notes")}
          <textarea
            className={`${inputClass} min-h-20 font-normal`}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <Feedback error={error} success={success} />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={ghostBtn}
            onClick={onClose}
            disabled={mutation.isPending}
          >
            {t("close")}
          </button>
          <button
            type="submit"
            className={primaryBtn}
            disabled={mutation.isPending || Boolean(success)}
          >
            {mutation.isPending ? t("submitting") : t("submit")}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* ---------------------------------------------------------------------------
 * POST /reservations/{id}/extend-grace
 * ------------------------------------------------------------------------- */
export const ExtendGraceModal: React.FC<BaseProps> = ({ isOpen, onClose, reservation }) => {
  const t = useTranslations("facilityManager.reservations.flowActions.grace");
  const getErrorMessage = useApiErrorMessage();
  const mutation = useExtendReservationGrace();
  const [hours, setHours] = useState("24");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!reservation) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const extensionHours = Number(hours);
    if (!Number.isInteger(extensionHours) || extensionHours < 1 || extensionHours > 72) {
      setError(t("errorHours"));
      return;
    }
    if (reason.trim().length < 5) {
      setError(t("errorReason"));
      return;
    }
    try {
      await mutation.mutateAsync({
        id: reservation.id,
        payload: { extensionHours, reason: reason.trim() },
      });
      setSuccess(t("success"));
      setTimeout(onClose, 800);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      busy={mutation.isPending}
      onClose={onClose}
      title={t("title")}
      subtitle={t("subtitle", { code: reservation.reservationCode })}
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1.5 text-xs font-bold text-slate-700">
          {t("hours")}
          <input
            type="number"
            min={1}
            max={72}
            step={1}
            className={`${inputClass} font-normal`}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <span className="block text-[11px] font-normal text-slate-500">{t("hoursHint")}</span>
        </label>
        <label className="block space-y-1.5 text-xs font-bold text-slate-700">
          {t("reason")}
          <textarea
            className={`${inputClass} min-h-20 font-normal`}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <Feedback error={error} success={success} />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={ghostBtn}
            onClick={onClose}
            disabled={mutation.isPending}
          >
            {t("close")}
          </button>
          <button
            type="submit"
            className={primaryBtn}
            disabled={mutation.isPending || Boolean(success)}
          >
            {mutation.isPending ? t("submitting") : t("submit")}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* ---------------------------------------------------------------------------
 * POST /reservations/{id}/reassign-unit
 * ------------------------------------------------------------------------- */
export const ReassignUnitModal: React.FC<BaseProps> = ({ isOpen, onClose, reservation }) => {
  const t = useTranslations("facilityManager.reservations.flowActions.reassign");
  const getErrorMessage = useApiErrorMessage();
  const mutation = useReassignReservationUnit();

  const unitTypeId = reservation?.offering?.unitTypeId;
  const unitsQuery = useAvailableStorageUnitsForAssignment(
    reservation?.facilityId,
    unitTypeId ? { unitTypeId } : undefined,
    isOpen && Boolean(reservation?.facilityId)
  );
  const units = useMemo(
    () => (unitsQuery.data ?? []).filter((u) => u.id !== reservation?.storageUnitId),
    [unitsQuery.data, reservation?.storageUnitId]
  );

  const [unitId, setUnitId] = useState("");
  const [reason, setReason] = useState("");
  const [oldUnitStatus, setOldUnitStatus] = useState<"under_maintenance" | "available">(
    "under_maintenance"
  );
  const [customerAgreed, setCustomerAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!reservation) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!unitId) {
      setError(t("errorUnit"));
      return;
    }
    if (reason.trim().length < 3) {
      setError(t("errorReason"));
      return;
    }
    try {
      await mutation.mutateAsync({
        id: reservation.id,
        payload: {
          newStorageUnitId: unitId,
          reason: reason.trim(),
          oldUnitStatus,
          customerAgreed,
        },
      });
      setSuccess(customerAgreed ? t("successApplied") : t("successProposed"));
      setTimeout(onClose, 1000);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      busy={mutation.isPending}
      onClose={onClose}
      title={t("title")}
      subtitle={t("subtitle", {
        code: reservation.reservationCode,
        unit: reservation.storageUnit?.unitNumber ?? "—",
      })}
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1.5 text-xs font-bold text-slate-700">
          {t("newUnit")}
          <select
            className={`${inputClass} font-normal`}
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
          >
            <option value="">{unitsQuery.isLoading ? t("loadingUnits") : t("pickUnit")}</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unitNumber} · {t("floor", { floor: u.floor })}
                {u.zone ? ` · ${u.zone}` : ""}
              </option>
            ))}
          </select>
          {!unitsQuery.isLoading && units.length === 0 && (
            <span className="block text-[11px] font-normal text-amber-700">{t("noUnits")}</span>
          )}
        </label>

        <label className="block space-y-1.5 text-xs font-bold text-slate-700">
          {t("reason")}
          <textarea
            className={`${inputClass} min-h-20 font-normal`}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>

        <label className="block space-y-1.5 text-xs font-bold text-slate-700">
          {t("oldUnitStatus")}
          <select
            className={`${inputClass} font-normal`}
            value={oldUnitStatus}
            onChange={(e) => setOldUnitStatus(e.target.value as "under_maintenance" | "available")}
          >
            <option value="under_maintenance">{t("oldUnderMaintenance")}</option>
            <option value="available">{t("oldAvailable")}</option>
          </select>
        </label>

        <label className="flex cursor-pointer items-start gap-2.5 text-xs text-slate-700">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-emerald-600"
            checked={customerAgreed}
            onChange={(e) => setCustomerAgreed(e.target.checked)}
          />
          <span>{t("customerAgreed")}</span>
        </label>

        <Feedback error={error} success={success} />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={ghostBtn}
            onClick={onClose}
            disabled={mutation.isPending}
          >
            {t("close")}
          </button>
          <button
            type="submit"
            className={primaryBtn}
            disabled={mutation.isPending || Boolean(success)}
          >
            {mutation.isPending ? t("submitting") : t("submit")}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
