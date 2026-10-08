"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateFacility } from "../hooks";
import type { CreateFacilityRequest } from "../types";

interface CreateFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_CITIES = [
  "Hà Nội",
  "Hồ Chí Minh",
  "Đà Nẵng",
  "Bình Dương",
  "Hải Phòng",
  "Cần Thơ",
  "Đồng Nai",
  "Bà Rịa - Vũng Tàu",
];

export const CreateFacilityModal = ({ isOpen, onClose }: CreateFacilityModalProps) => {
  const t = useTranslations("businessOps.facilities.createModal");
  const createFacilityMutation = useCreateFacility();

  const [formData, setFormData] = useState({
    name: "",
    city: "Hồ Chí Minh",
    address: "",
    phone: "",
    email: "",
    openTime: "08:00",
    closeTime: "21:00",
    description: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    city?: string;
    address?: string;
    phone?: string;
    email?: string;
    general?: string;
  }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      name: "",
      city: "Hồ Chí Minh",
      address: "",
      phone: "",
      email: "",
      openTime: "08:00",
      closeTime: "21:00",
      description: "",
    });
    setErrors({});
    setSuccessMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    const trimmedName = formData.name.trim();
    const trimmedCity = formData.city.trim();
    const trimmedAddress = formData.address.trim();
    const cleanedPhone = formData.phone.replace(/[\s-]/g, "");
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      newErrors.name = t("validation.nameRequired");
    } else if (trimmedName.length < 2) {
      newErrors.name = "Tên cơ sở cần tối thiểu 2 ký tự";
    }

    if (!trimmedCity) {
      newErrors.city = t("validation.cityRequired");
    }

    if (!trimmedAddress) {
      newErrors.address = t("validation.addressRequired");
    } else if (trimmedAddress.length < 5) {
      newErrors.address = "Địa chỉ cần chi tiết tối thiểu 5 ký tự (vd: Số 123 Đường Cầu Giấy)";
    }

    if (cleanedPhone) {
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
      if (!phoneRegex.test(cleanedPhone)) {
        newErrors.phone = "Số điện thoại không hợp lệ (vd: 0912345678)";
      }
    }

    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = "Email không đúng định dạng (vd: info@storagehub.vn)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setErrors({});
    setSuccessMessage(null);

    const cleanedPhone = formData.phone.replace(/[\s-]/g, "").trim();
    const cleanedEmail = formData.email.trim();
    const cleanedDescription = formData.description.trim();

    const payload: CreateFacilityRequest = {
      name: formData.name.trim(),
      city: formData.city.trim(),
      address: formData.address.trim(),
      phone: cleanedPhone || undefined,
      email: cleanedEmail || undefined,
      description: cleanedDescription || undefined,
      operatingHours:
        formData.openTime && formData.closeTime
          ? {
              open: formData.openTime,
              close: formData.closeTime,
            }
          : undefined,
    };

    try {
      await createFacilityMutation.mutateAsync(payload);
      setSuccessMessage(t("success"));
      setTimeout(() => {
        handleClose();
      }, 900);
    } catch (err: unknown) {
      // Avoid console.error to prevent Next.js turbopack dev error overlay
      const apiErr = err as {
        statusCode?: number;
        messageCode?: string;
        message?: string;
        errors?: Array<{ field?: string; message?: string }> | string[];
        raw?: {
          message?: string;
          errors?: Array<{ field?: string; message?: string }> | string[];
        };
      };

      const backendErrors = apiErr.errors || apiErr.raw?.errors;
      const backendMessage = apiErr.message || apiErr.raw?.message || "";
      const fieldErrors: typeof errors = {};

      if (Array.isArray(backendErrors)) {
        backendErrors.forEach((item) => {
          if (typeof item === "object" && item !== null && "field" in item) {
            const field = item.field;
            if (field === "name") fieldErrors.name = item.message || "Tên không hợp lệ";
            else if (field === "city") fieldErrors.city = item.message || "Thành phố không hợp lệ";
            else if (field === "address")
              fieldErrors.address = "Địa chỉ cần chi tiết tối thiểu 5 ký tự";
            else if (field === "phone")
              fieldErrors.phone = "Số điện thoại không đúng định dạng (vd: 0912345678)";
            else if (field === "email") fieldErrors.email = "Email không đúng định dạng";
          }
        });
      }

      if (
        apiErr.messageCode === "MESSAGE_CODE_105" ||
        backendMessage.toLowerCase().includes("already exists")
      ) {
        fieldErrors.name = "Tên cơ sở này đã tồn tại trong hệ thống. Vui lòng chọn tên khác.";
      }

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setErrors({
          general: backendMessage || t("error"),
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border border-slate-100 shadow-2xl bg-white">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-orange-500/10">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                <Building2 className="w-5 h-5" />
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* General Error Banner */}
          {errors.general && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Facility Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>{t("name")}</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t("namePlaceholder")}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 outline-none transition-all ${
                errors.name
                  ? "border-rose-400 focus:ring-rose-200"
                  : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
              }`}
            />
            {errors.name && <p className="text-[11px] text-rose-600 font-medium">{errors.name}</p>}
          </div>

          {/* City and Address Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* City */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>{t("city")}</span>
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
              >
                {POPULAR_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                <span>{t("address")}</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t("addressPlaceholder")}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 outline-none transition-all ${
                  errors.address
                    ? "border-rose-400 focus:ring-rose-200"
                    : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                }`}
              />
              {errors.address && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.address}</p>
              )}
            </div>
          </div>

          {/* Contact: Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>{t("phone")}</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t("phonePlaceholder")}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 outline-none transition-all ${
                  errors.phone
                    ? "border-rose-400 focus:ring-rose-200"
                    : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                }`}
              />
              {errors.phone && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-orange-500" />
                <span>{t("email")}</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t("emailPlaceholder")}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 outline-none transition-all ${
                  errors.email
                    ? "border-rose-400 focus:ring-rose-200"
                    : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                }`}
              />
              {errors.email && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Operating Hours (Open & Close Time) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>{t("operatingHours")}</span>
            </label>
            <div className="grid grid-cols-2 gap-4 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {t("openTime")}
                </span>
                <input
                  type="time"
                  value={formData.openTime}
                  onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {t("closeTime")}
                </span>
                <input
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{t("description")}</span>
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t("descriptionPlaceholder")}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={createFacilityMutation.isPending}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={createFacilityMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {createFacilityMutation.isPending ? t("saving") : t("submit")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
