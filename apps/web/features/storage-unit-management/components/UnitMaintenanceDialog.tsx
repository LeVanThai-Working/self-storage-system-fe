"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, DoorOpen, Info, MapPin, Pencil, Wrench } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UnitStatusBadge } from "@/components/common/UnitStatusBadge";
import { DimensionBadge } from "@/components/common/DimensionBadge";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useToggleMaintenance } from "../hooks";
import { StorageUnitStatusEnum, canToggleMaintenance, type StorageUnitResponse } from "../types";

const NOTES_MAX = 1000;

const LABEL = "block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5";

interface UnitMaintenanceDialogProps {
  unit: StorageUnitResponse;
  isOpen: boolean;
  onClose: () => void;
  /** Only provided in the manager portal; staff cannot edit unit details. */
  onEdit?: (unit: StorageUnitResponse) => void;
}

/** Unit summary + maintenance switch (AVAILABLE <-> UNDER_MAINTENANCE), shared by table and map views. */
export const UnitMaintenanceDialog = ({
  unit,
  isOpen,
  onClose,
  onEdit,
}: UnitMaintenanceDialogProps) => {
  const t = useTranslations("facilityManager.storageUnits");
  const tm = useTranslations("facilityManager.storageUnits.maintenanceModal");
  const getErrorMessage = useApiErrorMessage();
  const toggleMutation = useToggleMaintenance();

  const [notes, setNotes] = useState<string>(unit.notes ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isUnderMaintenance = unit.status === StorageUnitStatusEnum.UNDER_MAINTENANCE;
  const toggleable = canToggleMaintenance(unit.status);

  const handleToggle = async () => {
    setErrorMessage(null);
    const trimmed = notes.trim();
    if (trimmed.length > NOTES_MAX) {
      setErrorMessage(tm("notesMax", { max: NOTES_MAX }));
      return;
    }

    try {
      await toggleMutation.mutateAsync({
        id: unit.id,
        payload: {
          isUnderMaintenance: !isUnderMaintenance,
          // The backend overwrites the unit notes when `notes` is sent, so only send real changes.
          ...(trimmed !== (unit.notes ?? "").trim() && { notes: trimmed }),
        },
      });
      toast.success(
        isUnderMaintenance
          ? tm("successReopen", { unitNumber: unit.unitNumber })
          : tm("successStart", { unitNumber: unit.unitNumber })
      );
      onClose();
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, { MESSAGE_CODE_101: tm("errors.invalidStatus") }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6 rounded-3xl border-slate-100 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
              <DoorOpen className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                {unit.unitNumber}
              </DialogTitle>
              <div className="mt-1">
                <UnitStatusBadge status={unit.status} />
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm text-slate-600">
          {/* Unit summary */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t("table.location")}
              </p>
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {t("location.floor", { floor: unit.floor })}
                {unit.zone ? ` · ${t("location.zone", { zone: unit.zone })}` : ""}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t("table.unitType")}
              </p>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                {unit.unitType?.name ?? "—"}
              </p>
            </div>
            {unit.unitType && (
              <div className="col-span-2">
                <DimensionBadge
                  area={unit.unitType.area}
                  volume={unit.unitType.volume}
                  dimensions={unit.unitType.dimensions}
                />
              </div>
            )}
          </div>

          {toggleable ? (
            <>
              <div
                className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                  isUnderMaintenance
                    ? "bg-emerald-50 border-emerald-200/80 text-emerald-800"
                    : "bg-orange-50 border-orange-200/80 text-orange-800"
                }`}
              >
                {isUnderMaintenance ? tm("reopenHint") : tm("startHint")}
              </div>

              <div>
                <label className={LABEL}>{tm("notesLabel")}</label>
                <textarea
                  value={notes}
                  rows={3}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    isUnderMaintenance ? tm("reopenPlaceholder") : tm("startPlaceholder")
                  }
                  className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-[11px] text-slate-400">
                    {notes.length}/{NOTES_MAX}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs leading-relaxed">
              <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>{tm(`blocked.${unit.status}`)}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMessage}
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 gap-2 sm:gap-0">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(unit)}
              disabled={toggleMutation.isPending}
              className="sm:mr-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 text-xs font-bold transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              {t("actions.edit")}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={toggleMutation.isPending}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            {tm("close")}
          </button>
          {toggleable && (
            <button
              type="button"
              onClick={handleToggle}
              disabled={toggleMutation.isPending}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 ${
                isUnderMaintenance
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
              }`}
            >
              {toggleMutation.isPending ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isUnderMaintenance ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Wrench className="w-3.5 h-3.5" />
              )}
              {toggleMutation.isPending
                ? tm("saving")
                : isUnderMaintenance
                  ? tm("confirmReopen")
                  : tm("confirmStart")}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
