"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, Loader2 } from "lucide-react";
import { CloudinaryFolderEnum } from "@self-storage-system-fe/shared";
import { uploadToCloudinaryWeb } from "@/lib/cloudinary";

interface SignaturePadProps {
  /** Uploaded signature URL, or undefined when empty. */
  value?: string;
  onChange: (url: string | undefined) => void;
  folder?: CloudinaryFolderEnum | string;
  label: string;
  clearLabel: string;
  hint: string;
  disabled?: boolean;
}

/**
 * Canvas signature pad. The drawing is uploaded to Cloudinary as a PNG when the pen lifts,
 * so the parent only ever deals with a URL (BE expects `signatureUrl`).
 */
export function SignaturePad({
  value,
  onChange,
  folder = CloudinaryFolderEnum.INVENTORY_REQUESTS,
  label,
  clearLabel,
  hint,
  disabled,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const dirtyRef = useRef(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#102A2E";
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    dirtyRef.current = true;
    const { x, y } = point(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = point(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = async () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas || !dirtyRef.current) return;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    setUploading(true);
    try {
      const file = new File([blob], `signature-${Date.now()}.png`, { type: "image/png" });
      const result = await uploadToCloudinaryWeb(file, { folder, resourceType: "image" });
      onChange(result.secure_url);
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dirtyRef.current = false;
    onChange(undefined);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{label}</span>
        <button
          type="button"
          onClick={clear}
          disabled={disabled || uploading}
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline disabled:opacity-50"
        >
          <Eraser className="h-3.5 w-3.5" />
          {clearLabel}
        </button>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={() => void end()}
          onPointerLeave={() => void end()}
          className="h-28 w-full touch-none rounded-lg border border-dashed border-slate-300 bg-[repeating-linear-gradient(#fff_0px,#fff_27px,#eef2f2_28px)]"
        />
        {uploading ? (
          <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-teal-600" />
        ) : null}
      </div>
      <p className="text-[11px] text-slate-500">
        {value ? "✓ " : ""}
        {hint}
      </p>
    </div>
  );
}
