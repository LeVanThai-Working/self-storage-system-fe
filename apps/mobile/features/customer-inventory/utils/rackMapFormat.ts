import {
  MESSAGE_CODE,
  RackTierStatusEnum,
  type MessageLocale,
  type StorageUnitInventoryTreeResponse,
  type TreeRack,
  type TreeTier,
  type TreeTierItem,
  type TreeTierItemSku,
} from "@self-storage-system-fe/shared";
import { resolveReservationErrorMessage } from "@/features/reservations/utils/reservationFormat";

/** Ratio from which a tier is flagged as "near weight limit" (soft warning only, D6.3). */
export const TIER_WEIGHT_NEAR_RATIO = 0.8;

export const INVENTORY_ERROR = {
  FORBIDDEN: MESSAGE_CODE.MESSAGE_CODE_103,
  INSUFFICIENT_QUANTITY: MESSAGE_CODE.MESSAGE_CODE_621,
  CONTRACT_NOT_ACTIVE: MESSAGE_CODE.MESSAGE_CODE_622,
  TIER_NOT_IN_UNIT: MESSAGE_CODE.MESSAGE_CODE_624,
  TIER_LOCKED: MESSAGE_CODE.MESSAGE_CODE_625,
  SAME_POSITION: MESSAGE_CODE.MESSAGE_CODE_627,
} as const;

export type TierWeightLevel = "none" | "normal" | "near" | "over";

export interface TierWeightInfo {
  weightKg: number;
  maxWeightKg: number | null;
  ratio: number | null;
  level: TierWeightLevel;
}

export interface TierVisual {
  containerClassName: string;
  labelKey: string;
  locked: boolean;
}

export interface RoomSkuOption {
  sku: TreeTierItemSku;
  totalQuantity: number;
}

/** Location label shown on the map, e.g. "A101-R01-T01" (no facility code available from BE). */
export function buildLocationLabel(unitNumber: string | undefined, tierCode: string): string {
  return unitNumber ? `${unitNumber}-${tierCode}` : tierCode;
}

export function isTierLocked(status?: RackTierStatusEnum | null): boolean {
  return status === RackTierStatusEnum.MAINTENANCE || status === RackTierStatusEnum.INACTIVE;
}

export function getWeightLevel(weightKg: number, maxWeightKg?: number | null): TierWeightInfo {
  if (!maxWeightKg || maxWeightKg <= 0) {
    return { weightKg, maxWeightKg: null, ratio: null, level: "none" };
  }
  const ratio = weightKg / maxWeightKg;
  const level: TierWeightLevel =
    ratio > 1 ? "over" : ratio >= TIER_WEIGHT_NEAR_RATIO ? "near" : "normal";
  return { weightKg, maxWeightKg, ratio, level };
}

export function sumItemsWeight(items: TreeTierItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * (item.sku.weightKg ?? 0), 0);
}

export function getTierWeight(tier: TreeTier): TierWeightInfo {
  return getWeightLevel(sumItemsWeight(tier.items), tier.maxWeightKg);
}

export function formatWeightKg(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function getTierVisual(status?: RackTierStatusEnum | null): TierVisual {
  switch (status) {
    case RackTierStatusEnum.OCCUPIED:
      return {
        containerClassName:
          "border border-brand/30 border-l-4 border-l-brand bg-brand-bg dark:bg-brand/10",
        labelKey: "rackMap.status.occupied",
        locked: false,
      };
    case RackTierStatusEnum.MAINTENANCE:
      return {
        containerClassName: "border border-cta/40 bg-cta-light dark:bg-cta/15",
        labelKey: "rackMap.status.maintenance",
        locked: true,
      };
    case RackTierStatusEnum.INACTIVE:
      return {
        containerClassName:
          "border border-neutral-border dark:border-neutral-700 bg-neutral-border dark:bg-neutral-800 opacity-60",
        labelKey: "rackMap.status.inactive",
        locked: true,
      };
    default:
      return {
        containerClassName:
          "border border-dashed border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900",
        labelKey: "rackMap.status.available",
        locked: false,
      };
  }
}

export function findTierInTree(
  tree: StorageUnitInventoryTreeResponse | undefined,
  tierId: string | null
): { rack: TreeRack; tier: TreeTier } | null {
  if (!tree || !tierId) return null;
  for (const rack of tree.racks) {
    const tier = rack.tiers.find((item) => item.id === tierId);
    if (tier) return { rack, tier };
  }
  return null;
}

/** Label of a position: the tier location label, or the given floor label when `tierId` is null. */
export function getPositionLabel(
  tree: StorageUnitInventoryTreeResponse | undefined,
  tierId: string | null,
  floorLabel: string
): string {
  if (tierId === null) return floorLabel;
  const found = findTierInTree(tree, tierId);
  return found ? buildLocationLabel(tree?.storageUnit.unitNumber, found.tier.tierCode) : floorLabel;
}

/** Items at one position: a tier id, or `null` for floor (unracked) items. */
export function getPositionItems(
  tree: StorageUnitInventoryTreeResponse | undefined,
  tierId: string | null
): TreeTierItem[] {
  if (!tree) return [];
  if (tierId === null) return tree.unrackedItems;
  return findTierInTree(tree, tierId)?.tier.items ?? [];
}

/** Distinct SKUs currently stored anywhere in the unit (stock-in picker source). */
export function getRoomSkuOptions(
  tree: StorageUnitInventoryTreeResponse | undefined
): RoomSkuOption[] {
  if (!tree) return [];
  const map = new Map<string, RoomSkuOption>();
  const collect = (item: TreeTierItem) => {
    const existing = map.get(item.sku.id);
    if (existing) {
      existing.totalQuantity += item.quantity;
    } else {
      map.set(item.sku.id, { sku: item.sku, totalQuantity: item.quantity });
    }
  };
  tree.racks.forEach((rack) => rack.tiers.forEach((tier) => tier.items.forEach(collect)));
  tree.unrackedItems.forEach(collect);
  return Array.from(map.values()).sort((a, b) => a.sku.skuCode.localeCompare(b.sku.skuCode));
}

export function resolveInventoryError(
  error: unknown,
  locale: MessageLocale = "vi"
): { message: string; messageCode?: string } {
  return resolveReservationErrorMessage(error, locale, "storage unit");
}
