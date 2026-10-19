"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RotateCcw, AlertCircle, Loader2, Building2, Box } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppApiError } from "@/lib/api/axios";
import { useDeleteOffering, useRestoreOffering } from "../hooks";
import type { FacilityUnitTypeOfferingResponse } from "../types";

interface ConfirmOfferingModalProps {
  /** "delete" ngừng bán (soft delete qua DELETE /{id}); "restore" mở bán lại (POST /{id}/restore). */
  mode: "delete" | "restore";
  offering: FacilityUnitTypeOfferingResponse | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ConfirmOfferingModal = ({
  mode,
  offering,
  onClose,
  onSuccess,
}: ConfirmOfferingModalProps) => {
  const t = useTranslations("businessOps.offerings.confirmModal");
  const tOffering = useTranslations("businessOps.offerings");
  const deleteMutation = useDeleteOffering();
  const restoreMutation = useRestoreOffering();
  const mutation = mode === "delete" ? deleteMutation : restoreMutation;
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (mutation.isPending) return;
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!offering) return;
    setError(null);
    try {
      await mutation.mutateAsync(offering.id);
      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err instanceof AppApiError ? err.message : t("error"));
    }
  };

  if (!offering) return null;
  const isDelete = mode === "delete";

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

  return (
    <Dialog open={Boolean(offering)} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isDelete ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {isDelete ? <AlertTriangle className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
            </div>
            {isDelete ? t("deleteTitle") : t("restoreTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 mt-2">
          <p className="text-sm text-slate-500 leading-relaxed">
            {isDelete ? t("deleteDescription") : t("restoreDescription")}
          </p>

          {/* Offering Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-bold text-slate-900 text-sm">{offering.facility.name}</span>
              </div>
              <span className="text-xs text-slate-400 font-medium shrink-0">
                {offering.facility.city}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">
                  {offering.unitType.name}
                </span>
                {offering.unitType.category && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700">
                    {offering.unitType.category}
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-slate-900">
                {formatPrice(offering.pricePerUnit)}
                <span className="text-[11px] font-normal text-slate-400 ml-0.5">
                  /{tOffering(`billingUnit.${offering.billingUnit}`)}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs sm:text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
            className="rounded-xl"
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant={isDelete ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={mutation.isPending}
            className={`rounded-xl font-bold ${
              !isDelete
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                : ""
            }`}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("processing")}
              </>
            ) : (
              t("confirm")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
