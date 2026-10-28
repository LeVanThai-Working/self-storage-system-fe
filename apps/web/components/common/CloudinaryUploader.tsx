"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, X, FileText, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { CloudinaryFolderEnum } from "@self-storage-system-fe/shared";
import { uploadToCloudinaryWeb } from "@/lib/cloudinary";

interface CloudinaryUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: CloudinaryFolderEnum | string;
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const CloudinaryUploader: React.FC<CloudinaryUploaderProps> = ({
  value = [],
  onChange,
  folder = CloudinaryFolderEnum.GENERAL,
  multiple = true,
  maxFiles = 5,
  accept = "image/*,application/pdf",
  maxSizeMB = 10,
  label,
  description,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    if (disabled || isUploading) return;

    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (!multiple && fileArray.length > 1) {
      toast.error("Chỉ được tải lên 1 file");
      return;
    }

    if (multiple && value.length + fileArray.length > maxFiles) {
      toast.error(`Số lượng file tối đa là ${maxFiles}`);
      return;
    }

    // Validate size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    for (const f of fileArray) {
      if (f.size > maxSizeBytes) {
        toast.error(`File "${f.name}" vượt quá dung lượng cho phép (${maxSizeMB}MB)`);
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    const newUrls: string[] = [];

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const res = await uploadToCloudinaryWeb(file, {
          folder,
          onProgress: (percent) => {
            const overall = Math.round(((i + percent / 100) / fileArray.length) * 100);
            setUploadProgress(overall);
          },
        });
        newUrls.push(res.secure_url);
      }

      if (multiple) {
        onChange([...value, ...newUrls]);
      } else {
        onChange(newUrls);
      }
      toast.success("Tải file lên thành công!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload thất bại";
      toast.error(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove));
  };

  const isPdf = (url: string) => url.toLowerCase().endsWith(".pdf") || url.includes("/raw/");

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}

      {/* Dropzone */}
      {(!value.length || multiple) && (value.length < maxFiles || !multiple) && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !isUploading) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => {
            if (!disabled && !isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
            disabled || isUploading
              ? "opacity-60 cursor-not-allowed bg-slate-50 border-slate-200"
              : isDragOver
                ? "border-teal-500 bg-teal-50/50"
                : "border-slate-200 hover:border-teal-500 bg-slate-50/50 hover:bg-white"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled || isUploading}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                <div className="text-xs font-semibold text-slate-700">
                  Đang tải lên... {uploadProgress}%
                </div>
                <div className="w-48 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-teal-600 h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Kéo thả hoặc <span className="text-teal-600 underline">chọn file</span> từ thiết
                    bị
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {description || `Hỗ trợ ảnh, PDF tối đa ${maxSizeMB}MB`}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview list */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2.5 pt-1">
          {value.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 w-20 h-20 flex items-center justify-center shadow-xs"
            >
              {isPdf(url) ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-2 text-center text-slate-600 hover:text-teal-600"
                  title="Nhấn để xem tài liệu"
                >
                  <FileText className="w-6 h-6 text-rose-500 mb-1" />
                  <span className="text-[9px] font-semibold truncate max-w-[64px]">PDF Doc</span>
                </a>
              ) : (
                <Image
                  src={url}
                  alt={`Uploaded item ${idx + 1}`}
                  fill
                  sizes="80px"
                  unoptimized
                  className="object-cover"
                />
              )}

              {/* Remove button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(url);
                  }}
                  className="absolute top-1 right-1 bg-slate-900/70 hover:bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                  title="Xóa file"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {/* Quick Add icon button if already has items and allows multiple */}
          {multiple && value.length < maxFiles && !isUploading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 hover:border-teal-500 flex flex-col items-center justify-center text-slate-400 hover:text-teal-600 bg-slate-50/50 hover:bg-white transition-all cursor-pointer"
              title="Thêm file"
            >
              <ImagePlus className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium">Thêm</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
