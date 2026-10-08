"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Layers,
  Ruler,
  Maximize2,
  Box,
  Calendar,
  AlertCircle,
  Snowflake,
  Lock,
  Package,
  Boxes,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUnitType } from "../hooks";
import { UnitTypeCategoryEnum, UnitTypeStatusEnum } from "../types";

interface UnitTypeDetailModalProps {
  unitTypeId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UnitTypeDetailModal = ({ unitTypeId, isOpen, onClose }: UnitTypeDetailModalProps) => {
  const t = useTranslations("businessOps.unitTypes");
  const {
    data: unitType,
    isLoading,
    error,
  } = useUnitType(unitTypeId, {
    enabled: isOpen && Boolean(unitTypeId),
  });

  const renderCategoryBadge = (category?: string) => {
    switch (category) {
      case UnitTypeCategoryEnum.CLIMATE_CONTROLLED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/80">
            <Snowflake className="w-3.5 h-3.5 text-cyan-600" />
            {t("categoryFilter.climate_controlled")}
          </span>
        );
      case UnitTypeCategoryEnum.LOCKER:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            {t("categoryFilter.locker")}
          </span>
        );
      case UnitTypeCategoryEnum.SMALL:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <Box className="w-3.5 h-3.5 text-emerald-600" />
            {t("categoryFilter.small")}
          </span>
        );
      case UnitTypeCategoryEnum.MEDIUM:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            <Package className="w-3.5 h-3.5 text-amber-600" />
            {t("categoryFilter.medium")}
          </span>
        );
      case UnitTypeCategoryEnum.LARGE:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
            <Boxes className="w-3.5 h-3.5 text-purple-600" />
            {t("categoryFilter.large")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {category || "N/A"}
          </span>
        );
    }
  };

  const renderStatusBadge = (status?: string) => {
    const isActive = status === UnitTypeStatusEnum.ACTIVE;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          isActive
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
            : "bg-slate-100 text-slate-600 border border-slate-200"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
          }`}
        />
        {isActive ? t("status.active") : t("status.inactive")}
      </span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight">
                {t("detailModal.title")}
              </DialogTitle>
              <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {unitTypeId || "..."}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-5">
          {isLoading ? (
            <div className="space-y-4 py-6 animate-pulse">
              <div className="h-6 bg-slate-100 rounded-lg w-2/3" />
              <div className="h-4 bg-slate-50 rounded-lg w-full" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-16 bg-slate-100 rounded-2xl" />
                <div className="h-16 bg-slate-100 rounded-2xl" />
              </div>
            </div>
          ) : error || !unitType ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{t("detailModal.error")}</span>
            </div>
          ) : (
            <>
              {/* Name & Badges */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{unitType.name}</h3>
                    {unitType.description && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {unitType.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {renderCategoryBadge(unitType.category)}
                  {renderStatusBadge(unitType.status)}
                </div>
              </div>

              {/* Dimensions & Metrics */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <Ruler className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t("table.dimensions")}</span>
                </div>

                <div className="text-sm font-semibold font-mono text-slate-800 bg-white px-3 py-2 rounded-xl border border-slate-200/70 inline-block">
                  {unitType.dimensions?.length ?? 0}m (Dài) × {unitType.dimensions?.width ?? 0}m
                  (Rộng) × {unitType.dimensions?.height ?? 0}m (Cao)
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-white rounded-xl p-3 border border-teal-100 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {t("table.metrics")}
                      </div>
                      <div className="text-base font-extrabold text-teal-700 mt-0.5">
                        {unitType.area ?? 0} <span className="text-xs font-semibold">m²</span>
                      </div>
                    </div>
                    <Maximize2 className="w-4 h-4 text-teal-600" />
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Thể tích không gian
                      </div>
                      <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                        {unitType.volume ?? 0} <span className="text-xs font-semibold">m³</span>
                      </div>
                    </div>
                    <Box className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Features tags */}
              {unitType.features && unitType.features.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    {t("table.features")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {unitType.features.map((feat: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamp Info */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Tạo ngày: {new Date(unitType.createdAt).toLocaleDateString("vi-VN")}
                </span>
                <span>Cập nhật: {new Date(unitType.updatedAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 pt-3 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            {t("detailModal.close")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
