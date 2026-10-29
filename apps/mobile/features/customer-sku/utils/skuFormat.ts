import {
  MESSAGE_CODE,
  type CustomerSkuResponse,
  type InventoryDimensions,
  type MessageLocale,
} from "@self-storage-system-fe/shared";
import { AppApiError } from "@/lib/api/axios";
import { resolveReservationErrorMessage } from "@/features/reservations/utils/reservationFormat";

/** Category is a free string in BE; these are the suggested values shown as chips. */
export const SKU_CATEGORY_PRESETS = ["Gia dụng", "Hồ sơ", "Thời trang", "Điện tử", "Khác"] as const;

/** Unit-of-measure suggestions (BE default is "cái"). */
export const SKU_UOM_PRESETS = ["cái", "bộ", "thùng", "hộp", "đôi", "chiếc", "kg"] as const;

export const SKU_DEFAULT_UOM = "cái";

export const SKU_ERROR = {
  NOT_FOUND: MESSAGE_CODE.MESSAGE_CODE_610,
  CODE_EXISTS: MESSAGE_CODE.MESSAGE_CODE_611,
  BARCODE_EXISTS: MESSAGE_CODE.MESSAGE_CODE_612,
  HAS_INVENTORY: MESSAGE_CODE.MESSAGE_CODE_613,
} as const;

/** Volume in cm³, the same formula BE uses (L × W × H). */
export function computeSkuVolume(dimensions?: Partial<InventoryDimensions> | null): number | null {
  const { length, width, height } = dimensions ?? {};
  if (!length || !width || !height) return null;
  return Math.round(length * width * height * 100) / 100;
}

export function formatNumberVi(value: number): string {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

export function formatSkuDimensions(dimensions?: InventoryDimensions | null): string | null {
  if (!dimensions) return null;
  const { length, width, height } = dimensions;
  return `${formatNumberVi(length)}×${formatNumberVi(width)}×${formatNumberVi(height)} cm`;
}

export function formatSkuVolume(volume?: number | null): string | null {
  return volume ? `${formatNumberVi(volume)} cm³` : null;
}

export function formatSkuWeight(weightKg?: number | null): string | null {
  return weightKg || weightKg === 0 ? `${formatNumberVi(weightKg)} kg` : null;
}

/** "20×15×10 cm · 1,2 kg · 3.000 cm³" (parts that are missing are skipped). */
export function formatSkuSpec(sku: CustomerSkuResponse): string {
  return [
    formatSkuDimensions(sku.dimensions),
    formatSkuWeight(sku.weightKg),
    formatSkuVolume(sku.volume ?? computeSkuVolume(sku.dimensions)),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function isApiErrorCode(error: unknown, code: string): boolean {
  return error instanceof AppApiError && error.messageCode === code;
}

export function resolveSkuError(
  error: unknown,
  locale: MessageLocale = "vi"
): { message: string; messageCode?: string } {
  return resolveReservationErrorMessage(error, locale, "customer sku");
}
