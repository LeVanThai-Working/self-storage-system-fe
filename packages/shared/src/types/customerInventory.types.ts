import type { ContractStatusEnum } from "../enums/contract.enum";
import type { MovementTypeEnum } from "../enums/customerInventory.enum";
import type { RackStatusEnum, RackTierStatusEnum } from "../enums/storageRack.enum";
import type { StorageUnitStatusEnum } from "../enums/storageUnit.enum";
import type { RoleEnum } from "../enums/user.enum";

export interface InventoryDimensions {
  length: number;
  width: number;
  height: number;
}

export interface InventoryCustomerSnapshot {
  id: string;
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
}

export interface InventoryContractSnapshot {
  id: string;
  contractCode: string;
  status: ContractStatusEnum;
  startDate?: string | null;
  endDate?: string | null;
}

export interface InventoryFacilitySnapshot {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
}

export interface InventoryStorageUnitSnapshot {
  id: string;
  unitNumber: string;
  floor?: number | null;
  zone?: string | null;
  status?: StorageUnitStatusEnum | null;
}

export interface InventoryStorageRackSnapshot {
  id: string;
  rackCode: string;
  name?: string | null;
  status?: RackStatusEnum | null;
}

export interface InventoryRackTierSnapshot {
  id: string;
  tierNumber: number;
  tierCode: string;
  maxWeightKg?: number | null;
  status?: RackTierStatusEnum | null;
}

export interface InventorySkuSnapshot {
  id: string;
  skuCode: string;
  name: string;
  category?: string | null;
  barcode?: string | null;
  uom: string;
  imageUrl?: string | null;
}

export interface InventoryPerformerSnapshot {
  id: string;
  name: string;
  email?: string | null;
  role?: RoleEnum | null;
}

export interface CustomerInventoryResponse {
  id: string;
  customerId: string;
  contractId: string;
  facilityId: string;
  storageUnitId: string;
  storageRackId?: string | null;
  rackTierId?: string | null;
  skuId: string;
  quantity: number;
  lastMovementAt: string;
  notes?: string | null;
  customer?: InventoryCustomerSnapshot | null;
  contract?: InventoryContractSnapshot | null;
  facility?: InventoryFacilitySnapshot | null;
  storageUnit?: InventoryStorageUnitSnapshot | null;
  storageRack?: InventoryStorageRackSnapshot | null;
  rackTier?: InventoryRackTierSnapshot | null;
  sku?: InventorySkuSnapshot | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovementResponse {
  id: string;
  movementCode: string;
  type: MovementTypeEnum;
  customerInventoryId?: string | null;
  customerId: string;
  contractId: string;
  facilityId: string;
  storageUnitId: string;
  skuId: string;
  fromRackTierId?: string | null;
  toRackTierId?: string | null;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  performedBy: string;
  reason?: string | null;
  referenceCode?: string | null;
  notes?: string | null;
  customer?: InventoryCustomerSnapshot | null;
  contract?: InventoryContractSnapshot | null;
  facility?: InventoryFacilitySnapshot | null;
  storageUnit?: InventoryStorageUnitSnapshot | null;
  sku?: InventorySkuSnapshot | null;
  fromRackTier?: InventoryRackTierSnapshot | null;
  toRackTier?: InventoryRackTierSnapshot | null;
  performer?: InventoryPerformerSnapshot | null;
  createdAt: string;
  updatedAt: string;
}

export interface TreeTierItemSku {
  id: string;
  skuCode: string;
  name: string;
  category?: string | null;
  barcode?: string | null;
  uom: string;
  dimensions?: InventoryDimensions | null;
  volume?: number | null;
  weightKg?: number | null;
  imageUrl?: string | null;
}

export interface TreeTierItem {
  inventoryId: string;
  quantity: number;
  lastMovementAt: string;
  notes?: string | null;
  sku: TreeTierItemSku;
}

export interface TreeTier {
  id: string;
  tierNumber: number;
  tierCode: string;
  maxWeightKg?: number | null;
  dimensions?: InventoryDimensions | null;
  volume?: number | null;
  status?: RackTierStatusEnum | null;
  items: TreeTierItem[];
}

export interface TreeRack {
  id: string;
  rackCode: string;
  name?: string | null;
  status?: RackStatusEnum | null;
  tierCount: number;
  tiers: TreeTier[];
}

export interface StorageUnitInventoryTreeSummary {
  totalRacks: number;
  totalTiers: number;
  occupiedTiers: number;
  availableTiers: number;
  totalSkus: number;
  totalQuantity: number;
}

export interface StorageUnitInventoryTreeContract extends InventoryContractSnapshot {
  customer?: InventoryCustomerSnapshot | null;
}

export interface StorageUnitInventoryTreeResponse {
  storageUnit: InventoryStorageUnitSnapshot;
  contract?: StorageUnitInventoryTreeContract | null;
  summary: StorageUnitInventoryTreeSummary;
  racks: TreeRack[];
  unrackedItems: TreeTierItem[];
}

export interface SkuLocationItem {
  inventoryId: string;
  quantity: number;
  lastMovementAt: string;
  notes?: string | null;
  facility?: InventoryFacilitySnapshot | null;
  contract?: InventoryContractSnapshot | null;
  storageUnit?: InventoryStorageUnitSnapshot | null;
  storageRack?: InventoryStorageRackSnapshot | null;
  rackTier?: InventoryRackTierSnapshot | null;
}

export interface SkuLocationsSku extends InventorySkuSnapshot {
  totalQuantity: number;
}

export interface SkuLocationsResponse {
  sku: SkuLocationsSku;
  locations: SkuLocationItem[];
}

export interface CategoryBreakdown {
  category: string;
  skuCount: number;
  totalQuantity: number;
}

export interface CustomerInventorySummaryResponse {
  totalSkus: number;
  totalQuantity: number;
  totalActiveContracts: number;
  totalStorageUnits: number;
  categoryBreakdown: CategoryBreakdown[];
  recentMovements: InventoryMovementResponse[];
}
