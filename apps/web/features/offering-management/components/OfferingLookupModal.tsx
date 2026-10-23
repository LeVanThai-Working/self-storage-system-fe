"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Zap,
  Building2,
  Box,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  Eye,
  Pencil,
  Loader2,
  HelpCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFacilities } from "@/features/facility-management/hooks";
import { useUnitTypes } from "@/features/unit-type-management/hooks";
import { useCheckOffering } from "../hooks";
import { FacilityUnitTypeOfferingStatusEnum } from "../types";

interface OfferingLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onCreateWithPreset: (facilityId: string, unitTypeId: string) => void;
}

const inputClass =
  "w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm font-medium text-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer";

/**
 * Modal tra cứu nhanh bảng giá của một loại kho tại cơ sở cụ thể.
 * Endpoint: GET /facility-unit-type-offerings/facility/{facilityId}/unit-type/{unitTypeId}
 */
export const OfferingLookupModal = ({
  isOpen,
  onClose,
  onViewDetail,
  onEdit,
  onCreateWithPreset,
}: OfferingLookupModalProps) => {
  const t = useTranslations("businessOps.offerings.lookupModal");
  const tRoot = useTranslations("businessOps.offerings");

  const [selectedFacilityId, setSelectedFacilityId] = useState("");
  const [selectedUnitTypeId, setSelectedUnitTypeId] = useState("");

  const { data: facilitiesData } = useFacilities({ limit: 100 });
  const { data: unitTypesData } = useUnitTypes({ limit: 100 });

  // Quick lookup query: GET /facility-unit-type-offerings/facility/{f}/unit-type/{u}
  const isQueryEnabled = Boolean(isOpen && selectedFacilityId && selectedUnitTypeId);
  const {
    data: offering,
    isLoading,
    isFetching,
  } = useCheckOffering(selectedFacilityId, selectedUnitTypeId, {
    enabled: isQueryEnabled,
  });

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

  const handleClose = () => {
    setSelectedFacilityId("");
    setSelectedUnitTypeId("");
    onClose();
  };

  const handleCreateNew = () => {
    const fId = selectedFacilityId;
    const uId = selectedUnitTypeId;
    handleClose();
    onCreateWithPreset(fId, uId);
  };

  const isActive = offering?.status === FacilityUnitTypeOfferingStatusEnum.ACTIVE;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <p className="text-xs sm:text-sm text-slate-500">{t("description")}</p>

          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {t("facilityLabel")} <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className={inputClass}
              >
                <option value="">{t("facilityPlaceholder")}</option>
                {facilitiesData?.items.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                <Box className="w-3.5 h-3.5 text-slate-400" />
                {t("unitTypeLabel")} <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedUnitTypeId}
                onChange={(e) => setSelectedUnitTypeId(e.target.value)}
                className={inputClass}
              >
                <option value="">{t("unitTypePlaceholder")}</option>
                {unitTypesData?.items.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.area}m²)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result Area */}
          <div className="pt-2">
            {!selectedFacilityId || !selectedUnitTypeId ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs sm:text-sm flex flex-col items-center gap-2">
                <HelpCircle className="w-6 h-6 text-slate-300" />
                <span>{t("promptSelect")}</span>
              </div>
            ) : isLoading || isFetching ? (
              <div className="py-10 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                <span>{t("searching")}</span>
              </div>
            ) : offering ? (
              // Case 1: Found Offering (200 OK)
              <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 p-5 space-y-4 animate-in fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {offering.unitType.name}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {offering.facility.name} ({offering.facility.city})
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                      isActive
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    {isActive ? tRoot("status.active") : tRoot("status.inactive")}
                  </span>
                </div>

                {/* Specs grid */}
                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {t("price")}
                    </span>
                    <span className="font-black text-slate-900 text-sm mt-0.5 block">
                      {formatPrice(offering.pricePerUnit)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      /{tRoot(`billingUnit.${offering.billingUnit}`)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {t("deposit")}
                    </span>
                    <span className="font-black text-slate-900 text-sm mt-0.5 block">
                      {offering.depositMultiplier}x
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ≈ {formatPrice(offering.pricePerUnit * offering.depositMultiplier)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {t("minRentalDays")}
                    </span>
                    <span className="font-black text-slate-900 text-sm mt-0.5 block">
                      {offering.minRentalDays} ngày
                    </span>
                    <span className="text-[10px] text-slate-400">tối thiểu</span>
                  </div>
                </div>

                {offering.notes && (
                  <p className="text-xs text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-200/60 whitespace-pre-line">
                    <span className="font-semibold text-slate-700">Ghi chú:</span> {offering.notes}
                  </p>
                )}

                {/* Quick actions for found offering */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleClose();
                      onViewDetail(offering.id);
                    }}
                    className="rounded-xl text-xs gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t("viewDetail")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      handleClose();
                      onEdit(offering.id);
                    }}
                    className="rounded-xl text-xs gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {t("edit")}
                  </Button>
                </div>
              </div>
            ) : (
              // Case 2: Not found (404)
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-center space-y-3 animate-in fade-in">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{t("notFoundTitle")}</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {t("notFoundDescription")}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleCreateNew}
                  className="rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t("createNow")}
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={handleClose} className="rounded-xl">
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
