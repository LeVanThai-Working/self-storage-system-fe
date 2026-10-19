"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  Building2,
  Coins,
  Layers,
  MapPin,
  Pencil,
  Trash2,
  RotateCcw,
  Loader2,
  AlertCircle,
  Tag,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFacilityAmenityOffering } from "../hooks";
import { FacilityAmenityOfferingStatusEnum, type FacilityAmenityOfferingResponse } from "../types";

interface FacilityAmenityDetailModalProps {
  offeringId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (offering: FacilityAmenityOfferingResponse) => void;
  onRestore: (offering: FacilityAmenityOfferingResponse) => void;
}

export const FacilityAmenityDetailModal = ({
  offeringId,
  onClose,
  onEdit,
  onDelete,
  onRestore,
}: FacilityAmenityDetailModalProps) => {
  const t = useTranslations("businessOps.facilityAmenities.detailModal");

  const {
    data: offering,
    isLoading,
    isError,
    refetch,
  } = useFacilityAmenityOffering(offeringId, { enabled: Boolean(offeringId) });

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  const getStockStatusBadge = (available: number, total: number) => {
    if (total === 0 || available === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3 h-3" />
          {t("stock.outOfStock")}
        </span>
      );
    }
    if (available <= 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3" />
          {t("stock.lowStock")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" />
        {t("stock.inStock")}
      </span>
    );
  };

  return (
    <Dialog open={Boolean(offeringId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-14 flex flex-col items-center justify-center gap-3 text-sm text-slate-500">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            <span>{t("loading")}</span>
          </div>
        ) : isError || !offering ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3 text-sm text-rose-700">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <span>{t("error")}</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              className="rounded-xl"
            >
              {t("retry")}
            </Button>
          </div>
        ) : (
          <div className="space-y-5 mt-2">
            {/* Header Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-slate-900">
                    {offering.amenity.name}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60">
                    {offering.amenity.type}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">{offering.facility.name}</span>
                  <span className="text-slate-300">•</span>
                  <span>{offering.facility.city}</span>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {getStockStatusBadge(offering.availableQuantity, offering.totalQuantity)}
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    offering.status === FacilityAmenityOfferingStatusEnum.ACTIVE
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {t(`status.${offering.status}`)}
                </span>
              </div>
            </div>

            {/* Inventory Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  {t("inventoryTitle")}
                </span>
                <span className="text-xs text-slate-500">
                  {offering.totalQuantity > 0
                    ? `${Math.round((offering.inUseQuantity / offering.totalQuantity) * 100)}% đang thuê`
                    : "0%"}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                <div
                  className="bg-amber-500 h-2.5 transition-all duration-300"
                  style={{
                    width: `${
                      offering.totalQuantity > 0
                        ? (offering.inUseQuantity / offering.totalQuantity) * 100
                        : 0
                    }%`,
                  }}
                  title={`Đang dùng: ${offering.inUseQuantity}`}
                />
                <div
                  className="bg-emerald-500 h-2.5 transition-all duration-300"
                  style={{
                    width: `${
                      offering.totalQuantity > 0
                        ? (offering.availableQuantity / offering.totalQuantity) * 100
                        : 0
                    }%`,
                  }}
                  title={`Khả dụng: ${offering.availableQuantity}`}
                />
              </div>

              {/* Inventory Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[11px] text-slate-400 font-semibold">{t("totalQty")}</div>
                  <div className="text-base font-extrabold text-slate-800 mt-0.5">
                    {offering.totalQuantity}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
                  <div className="text-[11px] text-amber-700 font-semibold">{t("inUseQty")}</div>
                  <div className="text-base font-extrabold text-amber-800 mt-0.5">
                    {offering.inUseQuantity}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <div className="text-[11px] text-emerald-600 font-semibold">
                    {t("availableQty")}
                  </div>
                  <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                    {offering.availableQuantity}
                  </div>
                </div>
              </div>
            </div>

            {/* Price & Billing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Coins className="w-3.5 h-3.5" />
                  {t("priceLabel")}
                </div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  {formatPrice(offering.pricePerUnit)}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  /{t(`billingUnit.${offering.billingUnit}`)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                  {t("locationLabel")}
                </div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  {offering.facility.address || offering.facility.city}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{offering.facility.name}</div>
              </div>
            </div>

            {/* Amenity Description & Tags */}
            {offering.amenity.description && (
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {t("amenityDesc")}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {offering.amenity.description}
                </p>
                {offering.amenity.tags && offering.amenity.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {offering.amenity.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600"
                      >
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {offering.notes && (
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  {t("notesLabel")}
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">{offering.notes}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="p-3 rounded-2xl bg-slate-50/60 border border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t("createdAt")}: {formatDate(offering.createdAt)}
              </span>
              <span>
                {t("updatedAt")}: {formatDate(offering.updatedAt)}
              </span>
            </div>

            {/* Action Buttons */}
            <DialogFooter className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                {offering.status === FacilityAmenityOfferingStatusEnum.INACTIVE ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      onClose();
                      onRestore(offering);
                    }}
                    className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    {t("restoreButton")}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      onClose();
                      onDelete(offering);
                    }}
                    className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    {t("deleteButton")}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                  {t("close")}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(offering.id);
                  }}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  {t("editButton")}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
