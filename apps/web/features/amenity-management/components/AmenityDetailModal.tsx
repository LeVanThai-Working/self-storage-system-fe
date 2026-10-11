"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  Wrench,
  ShieldCheck,
  Tag,
  Calendar,
  X,
  ExternalLink,
  Layers,
  FileText,
  ImageIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AmenityTypeEnum, AmenityStatusEnum, type AmenityItem } from "../types";

interface AmenityDetailModalProps {
  amenity: AmenityItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AmenityDetailModal = ({ amenity, isOpen, onClose }: AmenityDetailModalProps) => {
  const t = useTranslations("businessOps.amenities");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!amenity) return null;

  const isPhysical = amenity.type === AmenityTypeEnum.PHYSICAL;
  const isActive = amenity.status === AmenityStatusEnum.ACTIVE;
  const images = amenity.images || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-slate-100 shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 p-6 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 text-teal-100 shadow-inner shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {/* Badge Phân loại */}
                  {isPhysical ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-100 border border-blue-400/30">
                      <Wrench className="w-3.5 h-3.5" />
                      {t("type.physical")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-100 border border-purple-400/30">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t("type.service")}
                    </span>
                  )}

                  {/* Badge Trạng thái */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/30"
                        : "bg-slate-500/20 text-slate-200 border border-slate-400/30"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    {isActive ? t("status.active") : t("status.inactive")}
                  </span>
                </div>

                <DialogHeader>
                  <DialogTitle className="text-xl font-bold tracking-tight text-white break-words">
                    {amenity.name}
                  </DialogTitle>
                </DialogHeader>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Gallery Images (nếu có) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                Hình ảnh tiện ích ({images.length})
              </h3>

              {images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImage(imgUrl)}
                      className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-xs hover:shadow-md transition-all"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`${amenity.name} - ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                        Phóng to
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  Chưa có hình ảnh nào được tải lên cho tiện ích này.
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Mô tả chi tiết
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                {amenity.description || "Không có mô tả chi tiết."}
              </p>
            </div>

            {/* Tags */}
            {amenity.tags && amenity.tags.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-500" />
                  Nhãn phân loại (Tags)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {amenity.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata (ID, Timestamps) */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <span>Mã định danh:</span>
                <code className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
                  {amenity.id}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Ngày tạo:</span>
                <span className="font-semibold text-slate-700">
                  {new Date(amenity.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Preview Modal for single image */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-3xl p-2 bg-slate-950/95 border-slate-800 rounded-3xl overflow-hidden text-white">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt="Enlarged preview"
                className="w-full max-h-[80vh] object-contain rounded-2xl"
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <a
                  href={selectedImage}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors"
                  title="Mở trong tab mới"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
