import {
  BillingUnitEnum,
  UnitTypeCategoryEnum,
  AmenityTypeEnum,
  formatCurrency,
} from "@self-storage-system-fe/shared";

/**
 * Formats an amount in VND using shared formatCurrency with fallback.
 */
export function formatVndPrice(amount: number): string {
  try {
    return formatCurrency(amount);
  } catch {
    return `${Number(amount || 0).toLocaleString("vi-VN")} ₫`;
  }
}

/**
 * Maps BillingUnitEnum to localized cycle suffix:
 * - BillingUnitEnum.MONTH -> "/ tháng" | "/ month"
 * - BillingUnitEnum.DAY -> "/ ngày" | "/ day"
 * - BillingUnitEnum.ONE_TIME -> "/ lần" | "/ one-time"
 */
export function getBillingUnitSuffix(
  billingUnit: BillingUnitEnum | string,
  t: (key: string) => string
): string {
  switch (billingUnit) {
    case BillingUnitEnum.MONTH:
      return t("storageExplore.billing_month");
    case BillingUnitEnum.DAY:
      return t("storageExplore.billing_day");
    case BillingUnitEnum.ONE_TIME:
      return t("storageExplore.billing_one_time");
    default:
      return t("storageExplore.billing_month");
  }
}

/**
 * Maps UnitTypeCategoryEnum to localized label.
 */
export function getUnitCategoryLabel(
  category: UnitTypeCategoryEnum | string | null | undefined,
  t: (key: string) => string
): string {
  if (!category) return t("storageExplore.category_small");
  switch (category) {
    case UnitTypeCategoryEnum.LOCKER:
      return t("storageExplore.category_locker");
    case UnitTypeCategoryEnum.SMALL:
      return t("storageExplore.category_small");
    case UnitTypeCategoryEnum.MEDIUM:
      return t("storageExplore.category_medium");
    case UnitTypeCategoryEnum.LARGE:
      return t("storageExplore.category_large");
    case UnitTypeCategoryEnum.CLIMATE_CONTROLLED:
      return t("storageExplore.category_climate_controlled");
    default:
      return String(category);
  }
}

/**
 * Maps AmenityTypeEnum to localized label.
 */
export function getAmenityTypeLabel(
  type: AmenityTypeEnum | string,
  t: (key: string) => string
): string {
  if (type === AmenityTypeEnum.SERVICE) {
    return t("facilityDetail.amenityType_service");
  }
  return t("facilityDetail.amenityType_physical");
}

/**
 * Calculates estimated deposit: pricePerUnit * depositMultiplier
 */
export function calculateEstimatedDeposit(pricePerUnit: number, depositMultiplier: number): number {
  return (pricePerUnit || 0) * (depositMultiplier ?? 1);
}
