"use client";

import React, { useState } from "react";
import { Wrench, ShieldCheck, ZoomIn } from "lucide-react";
import { AmenityTypeEnum } from "../types";

interface AmenityThumbnailProps {
  images?: string[];
  type: string;
  name: string;
  size?: "sm" | "md" | "lg";
  onPreview?: (imageUrl: string) => void;
}

export const AmenityThumbnail = ({
  images,
  type,
  name,
  size = "md",
  onPreview,
}: AmenityThumbnailProps) => {
  const [hasError, setHasError] = useState(false);
  const mainImage = images && images.length > 0 ? images[0] : null;

  const sizeClasses = {
    sm: "w-9 h-9 rounded-lg text-xs",
    md: "w-11 h-11 rounded-xl text-sm",
    lg: "w-16 h-16 rounded-2xl text-base",
  }[size];

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  }[size];

  // Nếu có ảnh và ảnh load thành công
  if (mainImage && !hasError) {
    return (
      <div
        className={`relative group/thumb ${sizeClasses} overflow-hidden border border-slate-200/80 bg-slate-100 flex-shrink-0 cursor-pointer shadow-2xs hover:shadow-md transition-all duration-200`}
        onClick={(e) => {
          if (onPreview) {
            e.stopPropagation();
            onPreview(mainImage);
          }
        }}
        title={`Xem ảnh phóng to: ${name}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mainImage}
          alt={name}
          className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
          onError={() => setHasError(true)}
          loading="lazy"
        />

        {/* Overlay hover phóng to */}
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
          <ZoomIn className="w-3.5 h-3.5" />
        </div>

        {/* Badge số lượng ảnh nếu có nhiều hơn 1 ảnh */}
        {images && images.length > 1 && (
          <span className="absolute bottom-0 right-0 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1 rounded-tl-md">
            +{images.length - 1}
          </span>
        )}
      </div>
    );
  }

  // Fallback icon khi không có ảnh hoặc ảnh bị lỗi
  const isPhysical = type === AmenityTypeEnum.PHYSICAL;
  return (
    <div
      className={`${sizeClasses} flex items-center justify-center flex-shrink-0 transition-colors ${
        isPhysical
          ? "bg-blue-50 text-blue-600 border border-blue-100/80 shadow-2xs"
          : "bg-purple-50 text-purple-600 border border-purple-100/80 shadow-2xs"
      }`}
      title={name}
    >
      {isPhysical ? <Wrench className={iconSizes} /> : <ShieldCheck className={iconSizes} />}
    </div>
  );
};
