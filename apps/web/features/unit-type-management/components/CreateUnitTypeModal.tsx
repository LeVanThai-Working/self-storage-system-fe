"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  Ruler,
  Maximize2,
  Box,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateUnitType } from "../hooks";
import { UnitTypeCategoryEnum, UnitTypeStatusEnum, type CreateUnitTypeRequest } from "../types";

interface CreateUnitTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateUnitTypeModal = ({ isOpen, onClose }: CreateUnitTypeModalProps) => {
  const t = useTranslations("businessOps.unitTypes.createModal");
  const createMutation = useCreateUnitType();

  // Form states
  const [name, setName] = useState<string>("");
  const [category, setCategory] = useState<string>(UnitTypeCategoryEnum.MEDIUM);
  const [length, setLength] = useState<string>("2");
  const [width, setWidth] = useState<string>("2");
  const [height, setHeight] = useState<string>("2.5");
  const [status, setStatus] = useState<string>(UnitTypeStatusEnum.ACTIVE);
  const [description, setDescription] = useState<string>("");
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-calculated area (m2) and volume (m3)
  const numLength = parseFloat(length) || 0;
  const numWidth = parseFloat(width) || 0;
  const numHeight = parseFloat(height) || 0;
  const calculatedArea = Number((numLength * numWidth).toFixed(2));
  const calculatedVolume = Number((numLength * numWidth * numHeight).toFixed(2));

  // Feature tag handlers
  const handleAddFeature = () => {
    const trimmed = featureInput.trim();
    if (trimmed && !features.includes(trimmed)) {
      setFeatures((prev) => [...prev, trimmed]);
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (featToRemove: string) => {
    setFeatures((prev) => prev.filter((f) => f !== featToRemove));
  };

  const handleFeatureKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddFeature();
    }
  };

  const resetForm = () => {
    setName("");
    setCategory(UnitTypeCategoryEnum.MEDIUM);
    setLength("2");
    setWidth("2");
    setHeight("2.5");
    setStatus(UnitTypeStatusEnum.ACTIVE);
    setDescription("");
    setFeatures([]);
    setFeatureInput("");
    setErrors({});
    setSuccessMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t("validation.nameRequired");
    }
    if (numLength <= 0 || numWidth <= 0 || numHeight <= 0) {
      newErrors.dimensions = t("validation.dimensionsRequired");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSuccessMessage(null);

    const finalFeatures = [...features];
    if (featureInput.trim() && !finalFeatures.includes(featureInput.trim())) {
      finalFeatures.push(featureInput.trim());
    }

    const payload: CreateUnitTypeRequest = {
      name: name.trim(),
      category,
      status,
      dimensions: {
        length: numLength,
        width: numWidth,
        height: numHeight,
      },
      description: description.trim() || undefined,
      features: finalFeatures.length > 0 ? finalFeatures : undefined,
    };

    try {
      await createMutation.mutateAsync(payload);
      setSuccessMessage(t("success"));
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err: unknown) {
      const apiErr = err as {
        response?: {
          data?: {
            message?: string;
            errors?: Array<string | { field?: string; message?: string }>;
          };
        };
        message?: string;
      };
      const errData = apiErr?.response?.data;
      let beMsg = errData?.message || apiErr?.message || t("error");
      if (Array.isArray(errData?.errors) && errData.errors.length > 0) {
        const firstErr = errData.errors[0];
        if (typeof firstErr === "string") {
          beMsg = firstErr;
        } else if (typeof firstErr === "object" && firstErr?.message) {
          beMsg = firstErr.message;
        }
      }
      setErrors({ general: beMsg });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-slate-100 shadow-2xl">
        {/* Modal Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight">
                {t("title")}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* General Error Banner */}
          {errors.general && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span className="font-medium">{errors.general}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* Row 1: Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Unit Type Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t("nameLabel")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder={t("namePlaceholder")}
                  className={`w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border ${
                    errors.name
                      ? "border-rose-400 focus:ring-rose-500/20"
                      : "border-slate-200/80 focus:border-teal-500 focus:ring-teal-500/20"
                  } focus:ring-2 outline-none transition-all`}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.name}</p>
              )}
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t("categoryLabel")}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm font-medium text-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
              >
                <option value={UnitTypeCategoryEnum.LOCKER}>Tủ đồ (Locker)</option>
                <option value={UnitTypeCategoryEnum.SMALL}>Kho nhỏ (Small)</option>
                <option value={UnitTypeCategoryEnum.MEDIUM}>Kho vừa (Medium)</option>
                <option value={UnitTypeCategoryEnum.LARGE}>Kho lớn (Large)</option>
                <option value={UnitTypeCategoryEnum.CLIMATE_CONTROLLED}>
                  Kiểm soát nhiệt độ (Climate Controlled)
                </option>
              </select>
            </div>
          </div>

          {/* Section: Standard Dimensions */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-teal-600" />
                {t("dimensionsGroup")}
              </span>
              <span className="text-[11px] text-slate-400">Đơn vị: mét (m)</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Length */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {t("lengthLabel")}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full bg-white text-sm font-mono font-medium text-slate-800 px-3 py-2 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>

              {/* Width */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {t("widthLabel")}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full bg-white text-sm font-mono font-medium text-slate-800 px-3 py-2 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>

              {/* Height */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {t("heightLabel")}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-white text-sm font-mono font-medium text-slate-800 px-3 py-2 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>
            </div>

            {errors.dimensions && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.dimensions}</p>
            )}

            {/* Real-time Auto-Calculated Metrics Card */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
              <div className="bg-white rounded-xl p-3 border border-teal-100 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t("floorArea")}
                  </div>
                  <div className="text-base font-extrabold text-teal-700 mt-0.5">
                    {calculatedArea} <span className="text-xs font-semibold">m²</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border border-emerald-100 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t("volume")}
                  </div>
                  <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                    {calculatedVolume} <span className="text-xs font-semibold">m³</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Box className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Status & Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Radio */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t("statusLabel")}
              </label>
              <div className="flex items-center gap-3 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="status"
                    checked={status === UnitTypeStatusEnum.ACTIVE}
                    onChange={() => setStatus(UnitTypeStatusEnum.ACTIVE)}
                    className="accent-teal-600"
                  />
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {t("statusActive")}
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="status"
                    checked={status === UnitTypeStatusEnum.INACTIVE}
                    onChange={() => setStatus(UnitTypeStatusEnum.INACTIVE)}
                    className="accent-teal-600"
                  />
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    {t("statusInactive")}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {t("descriptionLabel")}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Features Tag Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t("featuresLabel")}
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={handleFeatureKeyDown}
                placeholder={t("featuresPlaceholder")}
                className="flex-1 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 px-3.5 py-2 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("addFeature")}
              </button>
            </div>

            {/* Features Chip List */}
            {features.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50/80 rounded-xl border border-slate-100">
                {features.map((feat) => (
                  <span
                    key={feat}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200/70 shadow-xs"
                  >
                    <span>{feat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(feat)}
                      className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <DialogFooter className="pt-3 border-t border-slate-100 gap-2 sm:gap-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {createMutation.isPending && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {createMutation.isPending ? t("saving") : t("confirm")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
