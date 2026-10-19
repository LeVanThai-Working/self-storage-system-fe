"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  Building2,
  Package,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  Eye,
  Pencil,
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
import { FacilityStatusEnum } from "@/features/facility-management/types";
import { useAmenities } from "@/features/amenity-management/hooks";
import { AmenityStatusEnum } from "@/features/amenity-management/types";
import { useCheckFacilityAmenityOffering, useAvailableFacilityAmenities } from "../hooks";

interface FacilityAmenityLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onCreateWithPreset: (facilityId: string, amenityId: string) => void;
}

const inputClass =
  "w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm font-medium text-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all";

export const FacilityAmenityLookupModal = ({
  isOpen,
  onClose,
  onViewDetail,
  onEdit,
  onCreateWithPreset,
}: FacilityAmenityLookupModalProps) => {
  const t = useTranslations("businessOps.facilityAmenities.lookupModal");

  const [facilityId, setFacilityId] = useState("");
  const [amenityId, setAmenityId] = useState("");

  const { data: facilitiesData } = useFacilities({
    limit: 100,
    status: FacilityStatusEnum.ACTIVE,
  });
  const { data: amenitiesData } = useAmenities({
    limit: 100,
    status: AmenityStatusEnum.ACTIVE,
  });

  // Query 1: Tra cứu cặp cơ sở & tiện ích cụ thể (GET .../facility/{f}/amenity/{a})
  const lookupQuery = useCheckFacilityAmenityOffering(facilityId, amenityId, {
    enabled: isOpen && Boolean(facilityId && amenityId),
  });

  // Query 2: Lấy danh sách tiện ích còn trống của cơ sở (GET .../facility/{f}/available)
  const availableQuery = useAvailableFacilityAmenities(facilityId, {
    enabled: isOpen && Boolean(facilityId),
  });

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

  const handleReset = () => {
    setFacilityId("");
    setAmenityId("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
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
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">{t("selectFacilityPlaceholder")}</option>
                {facilitiesData?.items.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                {t("amenityLabel")}
              </label>
              <select
                value={amenityId}
                onChange={(e) => setAmenityId(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">{t("selectAmenityPlaceholder")}</option>
                {amenitiesData?.items.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Case 1: Đã chọn cả 2 -> Tra cứu cụ thể cặp này */}
          {facilityId && amenityId && (
            <div className="p-4 rounded-2xl border transition-all">
              {lookupQuery.isLoading ? (
                <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  {t("lookingUp")}
                </div>
              ) : lookupQuery.data ? (
                /* Tìm thấy phân bổ */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-sm text-slate-900">
                        {t("foundOffering")}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {lookupQuery.data.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50">
                      <div className="text-slate-400 font-semibold">{t("priceTitle")}</div>
                      <div className="text-base font-black text-slate-900 mt-0.5">
                        {formatPrice(lookupQuery.data.pricePerUnit)}
                        <span className="text-xs font-normal text-slate-500 ml-1">
                          /{t(`billingUnit.${lookupQuery.data.billingUnit}`)}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50">
                      <div className="text-slate-400 font-semibold">{t("stockTitle")}</div>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">
                        Khả dụng:{" "}
                        <span className="text-emerald-600 font-black">
                          {lookupQuery.data.availableQuantity}
                        </span>{" "}
                        / {lookupQuery.data.totalQuantity}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Đang dùng: {lookupQuery.data.inUseQuantity}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onClose();
                        onViewDetail(lookupQuery.data!.id);
                      }}
                      className="rounded-xl text-xs font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      {t("viewDetail")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        onClose();
                        onEdit(lookupQuery.data!.id);
                      }}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      {t("editOffering")}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Chưa có phân bổ -> gợi ý tạo mới */
                <div className="text-center py-4 space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-sm text-slate-800">{t("notConfiguredTitle")}</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {t("notConfiguredDescription")}
                  </p>
                  <Button
                    type="button"
                    onClick={() => {
                      onClose();
                      onCreateWithPreset(facilityId, amenityId);
                    }}
                    className="mt-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    {t("createWithPreset")}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Case 2: Đã chọn cơ sở -> Danh sách tiện ích còn trống (available) */}
          {facilityId && !amenityId && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  {t("availableListTitle")}
                </span>
                <span className="text-xs text-slate-400">
                  {availableQuery.data ? `${availableQuery.data.length} tiện ích còn trống` : ""}
                </span>
              </div>

              {availableQuery.isLoading ? (
                <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  {t("loadingAvailable")}
                </div>
              ) : availableQuery.data && availableQuery.data.length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 max-h-60 overflow-y-auto">
                  {availableQuery.data.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{item.amenity.name}</div>
                        <div className="text-slate-400 mt-0.5">
                          {formatPrice(item.pricePerUnit)} /{t(`billingUnit.${item.billingUnit}`)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Còn {item.availableQuantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onClose();
                            onViewDetail(item.id);
                          }}
                          className="h-8 px-2 text-slate-600 hover:text-emerald-600 rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 text-center text-xs text-slate-500">
                  {t("noAvailableAmenities")}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 flex items-center justify-between w-full">
          {Boolean(facilityId || amenityId) ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-700 rounded-xl"
            >
              Xóa bộ lọc
            </Button>
          ) : (
            <div />
          )}
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
