"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { UserCheck, Building2, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAssignFacilityManager, useFacilityManagers } from "../hooks";
import type { FacilityResponse } from "../types";

interface AssignManagerModalProps {
  facility: FacilityResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AssignManagerModal = ({ facility, isOpen, onClose }: AssignManagerModalProps) => {
  const t = useTranslations("businessOps.facilities.assignManagerModal");

  const { data: managers = [], isLoading: isLoadingManagers } = useFacilityManagers();
  const assignMutation = useAssignFacilityManager();

  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (facility && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedManagerId(facility.managerId || "");
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [facility, isOpen]);

  const handleClose = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facility) return;

    if (!selectedManagerId) {
      setErrorMessage(t("validationRequired"));
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await assignMutation.mutateAsync({
        id: facility.id,
        managerId: selectedManagerId,
      });

      setSuccessMessage(t("success"));
      setTimeout(() => {
        handleClose();
      }, 900);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setErrorMessage(apiErr.message || t("error"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg rounded-3xl p-0 border border-slate-100 shadow-2xl bg-white">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-orange-500/10">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                  {t("title")}
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Facility Info Card */}
          {facility && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  {t("facilityLabel")}
                </span>
                <p className="text-sm font-bold text-slate-900 truncate">{facility.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {facility.address}, {facility.city}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Manager Selection Dropdown */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>{t("selectManager")}</span>
            </label>

            {isLoadingManagers ? (
              <div className="flex items-center gap-2 py-3 px-3 text-xs text-slate-500 font-medium">
                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <span>Đang tải danh sách Quản lý cơ sở...</span>
              </div>
            ) : managers.length === 0 ? (
              <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                {t("noManagers")}
              </p>
            ) : (
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer font-medium"
              >
                <option value="">{t("placeholder")}</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Footer Actions */}
          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={assignMutation.isPending}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={assignMutation.isPending || isLoadingManagers || managers.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-bold shadow-md shadow-teal-500/25 hover:shadow-lg hover:shadow-teal-500/35 transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
            >
              {assignMutation.isPending && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{assignMutation.isPending ? t("saving") : t("confirm")}</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
