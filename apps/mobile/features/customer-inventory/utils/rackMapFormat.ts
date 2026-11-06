import {
  ContractStatusEnum,
  InventoryItemStatusEnum,
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
  CONTRACT_STATUS_BLOCKED: MESSAGE_CODE.MESSAGE_CODE_644,
  ITEM_STATUS_BLOCKED: MESSAGE_CODE.MESSAGE_CODE_645,
  RACK_NOT_RENTED: MESSAGE_CODE.MESSAGE_CODE_637,
} as const;

/** Item status; older rows may lack it, so default to `normal`. */
export function getItemStatus(item: Pick<TreeTierItem, "status">): InventoryItemStatusEnum {
  return item.status ?? InventoryItemStatusEnum.NORMAL;
}

/** Quantity a new outbound request can still take: stock minus what pending requests hold (G11). */
export function getAvailableQuantity(
  item: Pick<TreeTierItem, "quantity" | "availableQuantity" | "pendingOutboundQuantity">
): number {
  if (typeof item.availableQuantity === "number") return Math.max(0, item.availableQuantity);
  return Math.max(0, item.quantity - (item.pendingOutboundQuantity ?? 0));
}

/** Only `normal` items can be requested for pickup (BE rejects others with 645). */
export function canRequestOutboundItem(item: Pick<TreeTierItem, "status">): boolean {
  return getItemStatus(item) === InventoryItemStatusEnum.NORMAL;
}

/** Damaged or disputed items cannot be moved (645). */
export function canRequestMoveItem(item: Pick<TreeTierItem, "status">): boolean {
  const status = getItemStatus(item);
  return status !== InventoryItemStatusEnum.DAMAGED && status !== InventoryItemStatusEnum.DISPUTED;
}

/**
 * What the customer may request for a contract (INVENTORY_OPS_BY_CONTRACT_STATUS in BE):
 * ACTIVE allows everything, OVERDUE only pickup and move, other statuses are read-only.
 */
export function getContractRequestRights(status?: ContractStatusEnum | null) {
  const active = status === ContractStatusEnum.ACTIVE;
  const overdue = status === ContractStatusEnum.OVERDUE;
  return {
    canRequestOutbound: active || overdue,
    canRequestMove: active || overdue,
    canNotifyInbound: active,
    overdue,
  };
}

export type TierWeightLevel = "none" | "normal" | "near" | "over";

export interface TierWeightInfo {
  weightKg: number;
  maxWeightKg: number | null;
  ratio: number | null;
  level: TierWeightLevel;
}

/** Status shown to the customer (an "available" tier that still holds items counts as occupied). */
export type TierDisplayStatus = "available" | "occupied" | "maintenance" | "inactive";

/** Visual variant of a tier bar on the 2D rack map. */
export type TierBarVariant = TierDisplayStatus | "warning";

export interface RoomSkuOption {
  sku: TreeTierItemSku;
  totalQuantity: number;
}

export interface LocationLabelParts {
  facilityCode?: string | null;
  unitNumber?: string | null;
  rackCode?: string | null;
  tierCode: string;
}

function joinLabelParts(parts: (string | null | undefined)[]): string {
  return parts.filter((part): part is string => Boolean(part)).join("-");
}

/**
 * Tier location label, e.g. "HN01-A101-R01-T01". Missing parts are skipped, so a facility
 * without a code gives "A101-R01-T01". BE tier codes already carry the rack ("R01-T01"); the
 * rack code is only added when the tier code does not start with it.
 */
export function buildLocationLabel({
  facilityCode,
  unitNumber,
  rackCode,
  tierCode,
}: LocationLabelParts): string {
  const rackPart = rackCode && !tierCode.startsWith(`${rackCode}-`) ? rackCode : null;
  return joinLabelParts([facilityCode, unitNumber, rackPart, tierCode]);
}

/** Holding-area location label (items without a tier), e.g. "HN01-A101-HOLDING". */
export function buildFloorLabel(
  facilityCode: string | null | undefined,
  unitNumber: string | null | undefined
): string {
  return joinLabelParts([facilityCode, unitNumber, "HOLDING"]);
}

/** Tier location label inside the unit of `tree`. */
export function buildTreeTierLabel(
  tree: StorageUnitInventoryTreeResponse,
  rack: TreeRack,
  tier: TreeTier
): string {
  return buildLocationLabel({
    facilityCode: tree.facility?.code,
    unitNumber: tree.storageUnit.unitNumber,
    rackCode: rack.rackCode,
    tierCode: tier.tierCode,
  });
}

/** Short tier label used next to the rack drawing, e.g. "T04". */
export function formatTierShort(tierNumber: number): string {
  return `T${String(tierNumber).padStart(2, "0")}`;
}

/** Highest tier first, like a physical rack seen from the front. */
export function sortTiersTopDown(tiers: TreeTier[]): TreeTier[] {
  return [...tiers].sort((a, b) => b.tierNumber - a.tierNumber);
}

export function isTierLocked(status?: RackTierStatusEnum | null): boolean {
  return status === RackTierStatusEnum.MAINTENANCE || status === RackTierStatusEnum.INACTIVE;
}

export function getTierDisplayStatus(
  status?: RackTierStatusEnum | null,
  itemCount = 0
): TierDisplayStatus {
  if (status === RackTierStatusEnum.MAINTENANCE) return "maintenance";
  if (status === RackTierStatusEnum.INACTIVE) return "inactive";
  if (itemCount > 0 || status === RackTierStatusEnum.OCCUPIED) return "occupied";
  return "available";
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

export function sumItemsQuantity(items: TreeTierItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getTierWeight(tier: TreeTier): TierWeightInfo {
  return getWeightLevel(sumItemsWeight(tier.items), tier.maxWeightKg);
}

export function getTierBarVariant(tier: TreeTier): TierBarVariant {
  const status = getTierDisplayStatus(tier.status, tier.items.length);
  if (status !== "occupied") return status;
  if (tier.items.length === 0) return "available";
  const level = getTierWeight(tier).level;
  return level === "near" || level === "over" ? "warning" : "occupied";
}

export function formatWeightKg(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function findTierInTree(
  tree: StorageUnitInventoryTreeResponse | undefined,
  tierId: string | null | undefined
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
  if (tierId === null || !tree) return floorLabel;
  const found = findTierInTree(tree, tierId);
  return found ? buildTreeTierLabel(tree, found.rack, found.tier) : floorLabel;
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

export interface TreePosition {
  rack: TreeRack;
  tier: TreeTier;
  item: TreeTierItem;
  /** Stable key of one SKU at one tier. */
  key: string;
}

export function positionKey(tierId: string, skuId: string): string {
  return `${tierId}:${skuId}`;
}

/** Every SKU-at-tier in the unit, ordered by rack code then tier (top-down). */
export function listTreePositions(
  tree: StorageUnitInventoryTreeResponse | undefined
): TreePosition[] {
  if (!tree) return [];
  return [...tree.racks]
    .sort((a, b) => a.rackCode.localeCompare(b.rackCode))
    .flatMap((rack) =>
      sortTiersTopDown(rack.tiers).flatMap((tier) =>
        tier.items.map((item) => ({ rack, tier, item, key: positionKey(tier.id, item.sku.id) }))
      )
    );
}
