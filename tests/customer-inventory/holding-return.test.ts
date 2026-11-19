import { describe, expect, it, vi } from "vitest";
import {
  ContractStatusEnum,
  InventoryItemStatusEnum,
  RackStatusEnum,
  RackTierStatusEnum,
  stockMoveRequestSchema,
  type StorageUnitInventoryTreeResponse,
  type TreeTierItem,
} from "@self-storage-system-fe/shared";
import {
  canReturnToRack,
  canSelectMoveDestination,
  movableQuantity,
  effectiveTierStatus,
} from "../../apps/mobile/features/customer-inventory/utils/stockMovePolicy";
import { stockMoveApi } from "../../apps/mobile/features/customer-inventory/api/customerInventory.api";
import api from "../../apps/web/lib/api/axios";

vi.mock("../../apps/web/lib/api/axios", () => ({ default: { post: vi.fn() } }));

const item: TreeTierItem = {
  inventoryId: "inventory",
  canReturnToRack: true,
  quantity: 10,
  status: InventoryItemStatusEnum.TEMPORARY_HOLDING,
  lastMovementAt: "2026-11-19T00:00:00Z",
  sku: { id: "sku", skuCode: "SKU-01", name: "Boxes", uom: "box" },
};
const tree: StorageUnitInventoryTreeResponse = {
  contract: { id: "contract", contractCode: "C-01", status: ContractStatusEnum.ACTIVE },
  storageUnit: { id: "unit", unitNumber: "U01" },
  summary: {
    totalRacks: 1,
    totalTiers: 1,
    occupiedTiers: 0,
    availableTiers: 1,
    totalSkus: 1,
    totalQuantity: 10,
  },
  unrackedItems: [item],
  racks: [
    {
      id: "rack",
      rackCode: "R01",
      tierCount: 1,
      status: RackStatusEnum.RENTED,
      currentContractId: "contract",
      tiers: [
        {
          id: "tier",
          tierNumber: 1,
          tierCode: "T01",
          status: RackTierStatusEnum.AVAILABLE,
          items: [],
        },
      ],
    },
  ],
};

describe("Holding return permissions and destination selection", () => {
  it("shows parent rack maintenance even when its individual tier is available", () => {
    const tier = tree.racks[0].tiers[0];
    expect(effectiveTierStatus({ status: RackStatusEnum.MAINTENANCE }, tier)).toBe(
      RackTierStatusEnum.MAINTENANCE
    );
    expect(effectiveTierStatus({ status: RackStatusEnum.INACTIVE }, tier)).toBe(
      RackTierStatusEnum.INACTIVE
    );
    expect(effectiveTierStatus({ status: RackStatusEnum.RENTED }, tier)).toBe(
      RackTierStatusEnum.AVAILABLE
    );
  });
  it("requires an explicit BE release and keeps damaged/disputed items blocked", () => {
    expect(canReturnToRack(item)).toBe(true);
    expect(canReturnToRack({ ...item, canReturnToRack: undefined })).toBe(false);
    expect(canReturnToRack({ ...item, canReturnToRack: false })).toBe(false);
    for (const status of [InventoryItemStatusEnum.DAMAGED, InventoryItemStatusEnum.DISPUTED]) {
      expect(canReturnToRack({ ...item, status })).toBe(false);
    }
  });

  it("uses only available quantities and blocks empty or fully reserved stock", () => {
    expect(movableQuantity({ ...item, pendingOutboundQuantity: 3 })).toBe(7);
    expect(movableQuantity({ ...item, availableQuantity: 4 })).toBe(4);
    expect(canReturnToRack({ ...item, quantity: 0 })).toBe(false);
    expect(canReturnToRack({ ...item, pendingOutboundQuantity: 10 })).toBe(false);
  });

  it("accepts a healthy rented tier and rejects maintenance, wrong ownership, same source and frozen SKU", () => {
    const rack = tree.racks[0];
    const tier = rack.tiers[0];
    const allowed = (r = rack, t = tier, source: string | null = null) =>
      canSelectMoveDestination(tree, r, t, source, item.sku.id);
    expect(allowed()).toBe(true);
    expect(allowed(rack, tier, tier.id)).toBe(false);
    expect(allowed({ ...rack, currentContractId: "other" })).toBe(false);
    for (const status of [RackStatusEnum.MAINTENANCE, RackStatusEnum.INACTIVE])
      expect(allowed({ ...rack, status })).toBe(false);
    for (const status of [RackTierStatusEnum.MAINTENANCE, RackTierStatusEnum.INACTIVE])
      expect(allowed(rack, { ...tier, status })).toBe(false);
    expect(allowed(rack, { ...tier, items: [item] })).toBe(false);
    expect(
      allowed(rack, { ...tier, items: [{ ...item, status: InventoryItemStatusEnum.NORMAL }] })
    ).toBe(true);
  });
});

describe("Holding return API", () => {
  const payload = {
    contractId: "a".repeat(24),
    skuId: "b".repeat(24),
    fromRackTierId: null,
    toRackTierId: "c".repeat(24),
    quantity: 4,
    reason: "Return after closure",
  };

  it("preserves null source and sends a MOVE rather than a stock-in", async () => {
    const result = { id: "destination", quantity: 4, status: "normal" };
    vi.mocked(api.post).mockResolvedValue({ data: { data: result } });
    expect(await stockMoveApi(stockMoveRequestSchema.parse(payload))).toEqual(result);
    expect(api.post).toHaveBeenLastCalledWith("/customer-inventories/move", payload);
  });

  it("validates quantities/reason and propagates a stale release rejection", async () => {
    expect(stockMoveRequestSchema.safeParse({ ...payload, quantity: 0 }).success).toBe(false);
    expect(stockMoveRequestSchema.safeParse({ ...payload, reason: " " }).success).toBe(false);
    const error = { response: { data: { messageCode: "MESSAGE_CODE_645" } } };
    vi.mocked(api.post).mockRejectedValueOnce(error);
    await expect(stockMoveApi(payload)).rejects.toBe(error);
  });
});
