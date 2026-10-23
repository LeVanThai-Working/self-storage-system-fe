"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Eye,
  Building2,
  Box,
  MapPin,
  Coins,
  Calendar,
  ShieldCheck,
  FileText,
  Loader2,
  AlertCircle,
  Pencil,
  Clock,
  Trash2,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOffering } from "../hooks";
import {
  FacilityUnitTypeOfferingStatusEnum,
  type FacilityUnitTypeOfferingResponse,
} from "../types";

interface OfferingDetailModalProps {
  offeringId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete?: (offering: FacilityUnitTypeOfferingResponse) => void;
  onRestore?: (offering: FacilityUnitTypeOfferingResponse) => void;
}

/** API 3: GET /facility-unit-type-offerings/{id} — xem chi tiết một bảng giá. */
export const OfferingDetailModal = ({
  offeringId,
  onClose,
  onEdit,
  onDelete,
  onRestore,
}: OfferingDetailModalProps) => {
  const t = useTranslations("businessOps.offerings.detailModal");
  const tRoot = useTranslations("businessOps.offerings");

  const {
    data: offering,
    isLoading,
    isError,
    refetch,
  } = useOffering(offeringId, {
    enabled: Boolean(offeringId),
  });

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  const formatDate = (value: string) =>
    new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });

  const isActive = offering?.status === FacilityUnitTypeOfferingStatusEnum.ACTIVE;

  return (
    <Dialog open={Boolean(offeringId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center gap-3 text-sm text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            {t("loading")}
          </div>
        ) : isError || !offering ? (
          <div className="py-10 flex flex-col items-center gap-3 text-sm text-rose-700">
            <AlertCircle className="w-6 h-6 text-rose-500" />
            {t("error")}
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
          <div className="space-y-4 mt-1">
            {/* Giá nổi bật + trạng thái */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                    {t("price")}
                  </div>
                  <div className="text-3xl font-black mt-1">
                    {formatPrice(offering.pricePerUnit)}
                    <span className="text-sm font-medium text-emerald-100 ml-1">
                      /{tRoot(`billingUnit.${offering.billingUnit}`)}
                    </span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-900/30 text-slate-100"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? "bg-emerald-200 animate-pulse" : "bg-slate-300"
                    }`}
                  />
                  {isActive ? tRoot("status.active") : tRoot("status.inactive")}
                </span>
              </div>
            </div>

            {/* Cơ sở & Loại kho */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Building2 className="w-3.5 h-3.5" />
                  {t("facility")}
                </div>
                <div className="font-bold text-slate-900 mt-1.5">{offering.facility.name}</div>
                <div className="text-xs text-slate-500 flex items-start gap-1 mt-1">
                  <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>
                    {offering.facility.address ? `${offering.facility.address}, ` : ""}
                    {offering.facility.city}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Box className="w-3.5 h-3.5" />
                  {t("unitType")}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-bold text-slate-900">{offering.unitType.name}</span>
                  {offering.unitType.category && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60">
                      {offering.unitType.category}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {offering.unitType.area} m² • {offering.unitType.volume} m³
                  {offering.unitType.dimensions && (
                    <span className="text-slate-400">
                      {" "}
                      ({offering.unitType.dimensions.length}×{offering.unitType.dimensions.width}×
                      {offering.unitType.dimensions.height}m)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Chính sách */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl border border-slate-200/70">
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t("deposit")}
                </div>
                <div className="font-black text-slate-900 mt-1">{offering.depositMultiplier}x</div>
                <div className="text-[11px] text-slate-500">
                  ≈ {formatPrice(offering.pricePerUnit * offering.depositMultiplier)}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl border border-slate-200/70">
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {t("minRentalDays")}
                </div>
                <div className="font-black text-slate-900 mt-1">
                  {offering.minRentalDays} {t("days")}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl border border-slate-200/70">
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Coins className="w-3.5 h-3.5" />
                  {t("billingUnit")}
                </div>
                <div className="font-black text-slate-900 mt-1 capitalize">
                  {tRoot(`billingUnit.${offering.billingUnit}`)}
                </div>
              </div>
            </div>

            {/* Ghi chú */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <FileText className="w-3.5 h-3.5" />
                {t("notes")}
              </div>
              <p className="text-sm text-slate-700 mt-1.5 whitespace-pre-line">
                {offering.notes || <span className="text-slate-400 italic">{t("noNotes")}</span>}
              </p>
            </div>

            {/* Mốc thời gian */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t("createdAt")}: {formatDate(offering.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t("updatedAt")}: {formatDate(offering.updatedAt)}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 gap-2 sm:gap-2 flex-wrap sm:flex-nowrap">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
            {t("close")}
          </Button>

          {offering && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {isActive
                ? onDelete && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        onClose();
                        onDelete(offering);
                      }}
                      className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      {tRoot("actions.delete")}
                    </Button>
                  )
                : onRestore && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        onClose();
                        onRestore(offering);
                      }}
                      className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <RotateCcw className="w-4 h-4 mr-1.5" />
                      {tRoot("actions.restore")}
                    </Button>
                  )}

              <Button
                type="button"
                onClick={() => onEdit(offering.id)}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold"
              >
                <Pencil className="w-4 h-4 mr-1.5" />
                {t("edit")}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
