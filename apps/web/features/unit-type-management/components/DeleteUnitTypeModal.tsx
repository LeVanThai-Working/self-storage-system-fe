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
import { useDeleteUnitType } from "../hooks";

interface DeleteUnitTypeModalProps {
  unitType: { id: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (unitType: { id: string; name: string }) => void;
}

export const DeleteUnitTypeModal = ({
  unitType,
  isOpen,
  onClose,
  onDeleted,
}: DeleteUnitTypeModalProps) => {
  const t = useTranslations("businessOps.unitTypes.deleteModal");
  const deleteMutation = useDeleteUnitType();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  const handleConfirmDelete = async () => {
    if (!unitType) return;
    setErrorMessage(null);

    try {
      await deleteMutation.mutateAsync(unitType.id);
      onDeleted({ id: unitType.id, name: unitType.name });
      handleClose();
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMessage(apiErr?.response?.data?.message || apiErr?.message || t("error"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-6 rounded-3xl border-slate-100 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm text-slate-600">
          <p>{t("message", { name: unitType?.name || "" })}</p>
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs leading-relaxed">
            {t("warning")}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMessage}
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 gap-2 sm:gap-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={deleteMutation.isPending}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {deleteMutation.isPending && (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <Trash2 className="w-3.5 h-3.5" />
            {deleteMutation.isPending ? t("deleting") : t("confirm")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
