import { Maximize2, Ruler } from "lucide-react";

interface DimensionBadgeProps {
  /** Diện tích sàn (m²). */
  area: number;
  /** Thể tích (m³). */
  volume: number;
  /** Kích thước Dài × Rộng × Cao (m). Bỏ trống thì không hiện dòng kích thước. */
  dimensions?: { length: number; width: number; height: number } | null;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value ?? 0);

/** Hiển thị diện tích (m²), thể tích (m³) và kích thước D × R × C đã format. */
export const DimensionBadge = ({ area, volume, dimensions }: DimensionBadgeProps) => (
  <div className="space-y-0.5">
    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
      <Maximize2 className="w-3 h-3 text-teal-600" />
      <span>{formatNumber(area)} m²</span>
      <span className="text-[11px] text-slate-400 font-medium">· {formatNumber(volume)} m³</span>
    </div>
    {dimensions && (
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
        <Ruler className="w-3 h-3 text-slate-400" />
        <span>
          {formatNumber(dimensions.length)} × {formatNumber(dimensions.width)} ×{" "}
          {formatNumber(dimensions.height)} m
        </span>
      </div>
    )}
  </div>
);
