"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RotateCcw, AlertCircle } from "lucide-react";
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
  /** "delete" ngừng bán (soft delete); "restore" mở bán lại. */
  mode: "delete" | "restore";
  offering: FacilityUnitTypeOfferingResponse | null;
  onClose: () => void;
}

export const ConfirmOfferingModal = ({ mode, offering, onClose }: ConfirmOfferingModalProps) => {
  const t = useTranslations("businessOps.offerings.confirmModal");
  const deleteMutation = useDeleteOffering();
  const restoreMutation = useRestoreOffering();
  const mutation = mode === "delete" ? deleteMutation : restoreMutation;
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!offering) return;
    setError(null);
    try {
      await mutation.mutateAsync(offering.id);
      handleClose();
    } catch (err) {
      setError(err instanceof AppApiError ? err.message : t("error"));
    }
  };

  if (!offering) return null;
  const isDelete = mode === "delete";

  return (
    <Dialog open={Boolean(offering)} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDelete ? (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            ) : (
              <RotateCcw className="w-5 h-5 text-emerald-600" />
            )}
            {isDelete ? t("deleteTitle") : t("restoreTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            {isDelete ? t("deleteDescription") : t("restoreDescription")}
          </p>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div className="font-bold text-slate-900">{offering.facility.name}</div>
            <div className="text-slate-500">{offering.unitType.name}</div>
          </div>
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant={isDelete ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t("processing") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
