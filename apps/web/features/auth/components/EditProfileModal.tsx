"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { User, Mail, Phone, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CloudinaryUploader } from "@/components/common/CloudinaryUploader";
import { CloudinaryFolderEnum } from "@self-storage-system-fe/shared";
import { useAuthStore } from "../store";
import { useUpdateProfile } from "../hooks";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const updateProfileMutation = useUpdateProfile();

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; general?: string }>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(currentUser.name || "");
      setPhoneNumber(currentUser.phoneNumber || "");
      setAvatarUrl(currentUser.avatarUrl || "");
      setErrors({});
      setSuccessMsg(null);
    }
  }, [currentUser, isOpen]);

  const validate = () => {
    const newErrors: typeof errors = {};
    const trimmedName = name.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedName) {
      newErrors.name = "Họ và tên không được để trống";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Họ và tên tối thiểu 2 ký tự";
    }

    if (trimmedPhone) {
      const phoneRegex = /^0(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        newErrors.phone = "Số điện thoại không đúng định dạng (vd: 0912345678)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setErrors({});
    setSuccessMsg(null);

    try {
      await updateProfileMutation.mutateAsync({
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });

      setSuccessMsg("Cập nhật thông tin cá nhân thành công!");
      toast.success("Cập nhật hồ sơ thành công!");
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg =
        apiErr?.response?.data?.message || apiErr?.message || "Không thể cập nhật hồ sơ cá nhân";
      setErrors({ general: msg });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !updateProfileMutation.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden bg-white">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-orange-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">
                Hồ sơ cá nhân
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Cập nhật ảnh đại diện và thông tin liên hệ của bạn
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Success Banner */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* General Error Banner */}
          {errors.general && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Avatar Upload Preview Section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 flex-shrink-0 border-2 border-white shadow-md">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name || "Avatar"}
                  fill
                  sizes="80px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-orange-400 to-amber-500 text-white font-bold text-xl">
                  {name ? name[0]?.toUpperCase() : "U"}
                </div>
              )}
            </div>

            <div className="flex-1 w-full">
              <CloudinaryUploader
                label="Ảnh đại diện (Avatar)"
                description="Tải lên ảnh chân dung kích thước vuông (tối đa 5MB)"
                folder={CloudinaryFolderEnum.AVATARS}
                value={avatarUrl ? [avatarUrl] : []}
                onChange={(urls) => setAvatarUrl(urls[0] || "")}
                multiple={false}
                maxFiles={1}
                accept="image/*"
                maxSizeMB={5}
                disabled={updateProfileMutation.isPending}
              />
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>Họ và tên</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder="Nhập họ và tên..."
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-800 focus:bg-white focus:ring-2 outline-none transition-all ${
                errors.name
                  ? "border-rose-400 focus:ring-rose-200"
                  : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
              }`}
            />
            {errors.name && <p className="text-[11px] text-rose-600 font-medium">{errors.name}</p>}
          </div>

          {/* Email (Readonly) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email tài khoản</span>
            </label>
            <input
              type="email"
              value={currentUser?.email || ""}
              readOnly
              disabled
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-100/80 text-slate-500 cursor-not-allowed outline-none"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-teal-600" />
              <span>Số điện thoại</span>
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (errors.phone) setErrors({ ...errors, phone: undefined });
              }}
              placeholder="0912345678"
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-800 focus:bg-white focus:ring-2 outline-none transition-all ${
                errors.phone
                  ? "border-rose-400 focus:ring-rose-200"
                  : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
              }`}
            />
            {errors.phone && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.phone}</p>
            )}
          </div>

          {/* Footer Actions */}
          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={updateProfileMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {updateProfileMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
