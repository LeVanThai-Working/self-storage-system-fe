"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDeleteFacility } from "../hooks";

interface DeleteFacilityModalProps {
  facility: { id: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (facility: { id: string; name: string }) => void;
}

export const DeleteFacilityModal = ({
  facility,
  isOpen,
  onClose,
  onDeleted,
}: DeleteFacilityModalProps) => {
  const t = useTranslations("businessOps.facilities.deleteModal");
  const deleteMutation = useDeleteFacility();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!facility) return;
    setErrorMessage(null);

    try {
      await deleteMutation.mutateAsync(facility.id);
      onDeleted(facility);
      handleClose();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setErrorMessage(apiErr.message || t("error"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md rounded-3xl p-6 border border-slate-100 shadow-2xl bg-white">
        <DialogHeader>
          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 shadow-sm">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {t("title")}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {errorMessage && (
          <div className="my-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <div className="py-2 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            {t("message", { name: facility?.name || "" })}
          </p>

          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed font-medium">{t("warning")}</p>
          </div>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={deleteMutation.isPending}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white text-sm font-bold shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/35 transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
          >
            {deleteMutation.isPending && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{deleteMutation.isPending ? t("deleting") : t("confirm")}</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
