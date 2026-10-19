"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RotateCcw, Trash2, Loader2, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppApiError } from "@/lib/api/axios";
import { useDeleteFacilityAmenityOffering, useRestoreFacilityAmenityOffering } from "../hooks";
import type { FacilityAmenityOfferingResponse } from "../types";

interface ConfirmFacilityAmenityModalProps {
  mode: "delete" | "restore";
  offering: FacilityAmenityOfferingResponse | null;
  onClose: () => void;
}

export const ConfirmFacilityAmenityModal = ({
  mode,
  offering,
  onClose,
}: ConfirmFacilityAmenityModalProps) => {
  const t = useTranslations("businessOps.facilityAmenities.confirmModal");
  const isDelete = mode === "delete";

  const deleteMutation = useDeleteFacilityAmenityOffering();
  const restoreMutation = useRestoreFacilityAmenityOffering();

  const [error, setError] = useState<string | null>(null);

  if (!offering) return null;

  const isPending = deleteMutation.isPending || restoreMutation.isPending;

  const handleConfirm = async () => {
    setError(null);
    try {
      if (isDelete) {
        await deleteMutation.mutateAsync(offering.id);
      } else {
        await restoreMutation.mutateAsync(offering.id);
      }
      onClose();
    } catch (err) {
      setError(err instanceof AppApiError ? err.message : t("error"));
    }
  };

  return (
    <Dialog open={Boolean(offering)} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="sm:max-w-md p-6 rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isDelete ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {isDelete ? <AlertTriangle className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {isDelete ? t("deleteTitle") : t("restoreTitle")}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 my-2 text-sm">
          <p className="text-slate-600 text-xs sm:text-sm">
            {isDelete ? t("deleteDescription") : t("restoreDescription")}
          </p>

          {/* Info Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              {offering.amenity.name}
            </div>
            <div className="text-xs text-slate-500">
              {offering.facility.name} ({offering.facility.city})
            </div>
            <div className="text-xs text-slate-400 pt-0.5">
              Tồn kho: {offering.availableQuantity}/{offering.totalQuantity} • Đang dùng:{" "}
              {offering.inUseQuantity}
            </div>
          </div>

          {isDelete && offering.inUseQuantity > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{t("inUseWarning", { count: offering.inUseQuantity })}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl"
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={`rounded-xl font-bold text-white shadow-md cursor-pointer ${
              isDelete
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("processing")}
              </>
            ) : isDelete ? (
              <>
                <Trash2 className="w-4 h-4 mr-1.5" />
                {t("confirmDelete")}
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-1.5" />
                {t("confirmRestore")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
