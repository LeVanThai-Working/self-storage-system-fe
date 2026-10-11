"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  Wrench,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
  FileText,
  Tag,
  ImageIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateAmenity } from "../hooks";
import { AmenityTypeEnum, AmenityStatusEnum, type CreateAmenityRequest } from "../types";

interface CreateAmenityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAmenityModal = ({ isOpen, onClose }: CreateAmenityModalProps) => {
  const t = useTranslations("businessOps.amenities.createModal");
  const createMutation = useCreateAmenity();

  // Form states
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<AmenityTypeEnum>(AmenityTypeEnum.PHYSICAL);
  const [status, setStatus] = useState<AmenityStatusEnum>(AmenityStatusEnum.ACTIVE);
  const [description, setDescription] = useState<string>("");

  // Tags state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");

  // Images state
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState<string>("");

  // Error & Feedback states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tag handlers
  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((item) => item !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Image handlers
  const handleAddImage = () => {
    const trimmed = imageInput.trim();
    if (trimmed && !images.includes(trimmed)) {
      setImages((prev) => [...prev, trimmed]);
      setImageInput("");
    }
  };

  const handleRemoveImage = (imgToRemove: string) => {
    setImages((prev) => prev.filter((item) => item !== imgToRemove));
  };

  const handleImageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddImage();
    }
  };

  // Reset form
  const resetForm = () => {
    setName("");
    setType(AmenityTypeEnum.PHYSICAL);
    setStatus(AmenityStatusEnum.ACTIVE);
    setDescription("");
    setTags([]);
    setTagInput("");
    setImages([]);
    setImageInput("");
    setErrors({});
    setSuccessMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t("validation.nameRequired");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSuccessMessage(null);

    // Chuẩn bị tags và images (đảm bảo là array)
    const finalTags = [...tags];
    if (tagInput.trim() && !finalTags.includes(tagInput.trim().toLowerCase())) {
      finalTags.push(tagInput.trim().toLowerCase());
    }

    const finalImages = [...images];
    if (imageInput.trim() && !finalImages.includes(imageInput.trim())) {
      finalImages.push(imageInput.trim());
    }

    const payload: CreateAmenityRequest = {
      name: name.trim(),
      type,
      status,
      description: description.trim() || undefined,
      tags: finalTags,
      images: finalImages,
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
          status?: number;
          data?: {
            message?: string;
            errors?: string | Array<string | { field?: string; message?: string }>;
          };
        };
        message?: string;
      };

      const errData = apiErr?.response?.data;
      const beMsg = errData?.message || "";
      const rawErrors = typeof errData?.errors === "string" ? errData.errors : "";

      // Kiểm tra trùng tên: Backend trả về 400 và có thông báo lỗi liên quan đến already exists / duplicate / trùng tên
      const combinedErrorText = `${beMsg} ${rawErrors} ${apiErr?.message || ""}`.toLowerCase();
      const isDuplicateName =
        combinedErrorText.includes("already exist") ||
        combinedErrorText.includes("already exists") ||
        combinedErrorText.includes("duplicate") ||
        combinedErrorText.includes("trùng");

      if (isDuplicateName) {
        setErrors({
          name: t("duplicateNameError"),
          general: t("duplicateNameError"),
        });
        return;
      }

      // Xử lý các lỗi khác
      let finalMsg = beMsg || rawErrors || apiErr?.message || t("error");
      if (Array.isArray(errData?.errors) && errData.errors.length > 0) {
        const firstErr = errData.errors[0];
        if (typeof firstErr === "string") {
          finalMsg = firstErr;
        } else if (typeof firstErr === "object" && firstErr?.message) {
          finalMsg = firstErr.message;
        }
      }

      setErrors({ general: finalMsg });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-slate-100 shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 p-6 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 text-teal-100 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight text-white">
                  {t("title")}
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-teal-100/90 mt-1 leading-relaxed">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3 text-emerald-800 text-sm font-medium animate-in fade-in zoom-in-95">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* General Error Banner (đặc biệt hiển thị cảnh báo đỏ khi trùng tên) */}
          {errors.general && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 text-rose-800 text-sm font-medium animate-in fade-in zoom-in-95">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold block mb-0.5">
                  {errors.name ? t("duplicateNameError") : t("error")}
                </span>
                <span className="text-xs text-rose-700">{errors.general}</span>
              </div>
            </div>
          )}

          {/* Amenity Name Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              {t("nameLabel")} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.name;
                      delete next.general;
                      return next;
                    });
                  }
                }}
                placeholder={t("namePlaceholder")}
                className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20"
                    : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 focus:bg-white"
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Classification Selection (PHYSICAL vs SERVICE) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              {t("typeLabel")} <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: PHYSICAL */}
              <button
                type="button"
                onClick={() => setType(AmenityTypeEnum.PHYSICAL)}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  type === AmenityTypeEnum.PHYSICAL
                    ? "bg-blue-50/70 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    type === AmenityTypeEnum.PHYSICAL
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{t("typePhysical")}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                      Blue
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                    {t("typePhysicalDesc")}
                  </p>
                </div>
              </button>

              {/* Option 2: SERVICE */}
              <button
                type="button"
                onClick={() => setType(AmenityTypeEnum.SERVICE)}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  type === AmenityTypeEnum.SERVICE
                    ? "bg-purple-50/70 border-purple-500 text-purple-900 ring-2 ring-purple-500/20 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    type === AmenityTypeEnum.SERVICE
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{t("typeService")}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                      Purple
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                    {t("typeServiceDesc")}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              {t("statusLabel")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus(AmenityStatusEnum.ACTIVE)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                  status === AmenityStatusEnum.ACTIVE
                    ? "bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/20"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t("statusActive")}
              </button>
              <button
                type="button"
                onClick={() => setStatus(AmenityStatusEnum.INACTIVE)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                  status === AmenityStatusEnum.INACTIVE
                    ? "bg-slate-100 border-slate-400 text-slate-800 ring-2 ring-slate-400/20"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t("statusInactive")}
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                {t("descriptionLabel")}
              </span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Tags Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                {t("tagsLabel")}
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={t("tagsPlaceholder")}
                className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("addTag")}
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {tags.map((tagItem) => (
                  <span
                    key={tagItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    #{tagItem}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tagItem)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Image URLs Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                {t("imagesLabel")}
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyDown={handleImageKeyDown}
                placeholder={t("imagesPlaceholder")}
                className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("addImage")}
              </button>
            </div>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {images.map((imgUrl, idx) => (
                  <div
                    key={`${imgUrl}-${idx}`}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 w-16 h-16 flex items-center justify-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={`Amenity image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(imgUrl)}
                      className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <DialogFooter className="pt-3 border-t border-slate-100 sm:justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-semibold shadow-md shadow-teal-700/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {t("submit")}
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
