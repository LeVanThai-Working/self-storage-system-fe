import {
  InventoryItemStatusEnum,
  RackStatusEnum,
  RackTierStatusEnum,
  type StorageUnitInventoryTreeResponse,
  type TreeRack,
  type TreeTier,
  type TreeTierItem,
} from "@self-storage-system-fe/shared";

export function movableQuantity(item: TreeTierItem): number {
  return Math.max(0, item.availableQuantity ?? item.quantity - (item.pendingOutboundQuantity ?? 0));
}

export function isRackLocked(rack: Pick<TreeRack, "status">): boolean {
  return rack.status === RackStatusEnum.MAINTENANCE || rack.status === RackStatusEnum.INACTIVE;
}

/** A locked parent rack takes precedence over an individually available tier. */
export function effectiveTierStatus(
  rack: Pick<TreeRack, "status">,
  tier: Pick<TreeTier, "status">
) {
  if (rack.status === RackStatusEnum.MAINTENANCE) return RackTierStatusEnum.MAINTENANCE;
  if (rack.status === RackStatusEnum.INACTIVE) return RackTierStatusEnum.INACTIVE;
  return tier.status;
}

export function canReturnToRack(item: TreeTierItem): boolean {
  return (
    item.canReturnToRack === true &&
    movableQuantity(item) > 0 &&
    (!item.status ||
      item.status === InventoryItemStatusEnum.NORMAL ||
      item.status === InventoryItemStatusEnum.TEMPORARY_HOLDING)
  );
}

export function canSelectMoveDestination(
  tree: StorageUnitInventoryTreeResponse,
  rack: TreeRack,
  tier: TreeTier,
  sourceTierId: string | null,
  skuId: string | null
): boolean {
  return (
    tier.id !== sourceTierId &&
    !isRackLocked(rack) &&
    tier.status !== RackTierStatusEnum.MAINTENANCE &&
    tier.status !== RackTierStatusEnum.INACTIVE &&
    !(rack.currentContractId && tree.contract?.id && rack.currentContractId !== tree.contract.id) &&
    !tier.items.some(
      (item) =>
        item.sku.id === skuId && item.status && item.status !== InventoryItemStatusEnum.NORMAL
    )
  );
}
