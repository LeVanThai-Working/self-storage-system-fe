"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDeleteAmenity } from "../hooks";
import type { AmenityItem } from "../types";

interface DeleteAmenityModalProps {
  amenity: AmenityItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAmenityModal = ({ amenity, isOpen, onClose }: DeleteAmenityModalProps) => {
  const t = useTranslations("businessOps.amenities.deleteModal");
  const deleteMutation = useDeleteAmenity();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleClose = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  const handleDelete = async () => {
    if (!amenity?.id) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteMutation.mutateAsync(amenity.id);
      setSuccessMessage(t("success"));
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err: unknown) {
      const apiErr = err as {
        response?: {
          data?: {
            message?: string;
          };
        };
        message?: string;
      };
      setErrorMessage(apiErr?.response?.data?.message || apiErr?.message || t("error"));
    }
  };

  if (!amenity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        {/* Header Alert */}
        <div className="bg-rose-50 p-6 border-b border-rose-100 flex items-start gap-4">
          <div className="p-3 bg-rose-100 rounded-2xl text-rose-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-rose-950">{t("title")}</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-rose-700 font-medium mt-1">{t("warning")}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-medium animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm font-medium animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <p className="text-xs text-slate-500 leading-relaxed">{t("description")}</p>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{t("amenityName")}</span>
            <span className="text-xs font-bold text-slate-900">{amenity.name}</span>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50/50 sm:justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={deleteMutation.isPending}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {deleteMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t("deleting")}
              </>
            ) : (
              t("confirm")
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
