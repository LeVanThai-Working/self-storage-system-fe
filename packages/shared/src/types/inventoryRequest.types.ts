import type {
  InventoryRequestStatusEnum,
  InventoryRequestTypeEnum,
} from "../enums/customerInventory.enum";

export interface InventoryRequestItemResponse {
  skuId: string;
  skuCode?: string;
  name?: string;
  barcode?: string;
  uom?: string;
  quantity: number;
  actualQuantity?: number;
  discrepancyQuantity?: number;
  storageRackId?: string;
  rackCode?: string;
  aisle?: string;
  bay?: number;
  zone?: string;
  rackTierId?: string;
  tierNumber?: number;
}

export interface InventoryTransporterInfo {
  name: string;
  phoneNumber: string;
  vehiclePlate?: string;
  deliveryCompany?: string;
}

export interface InventoryRequestResponse {
  id: string;
  /** REQ-OUT-YYYYMMDD-0001 / REQ-IN-YYYYMMDD-0001 */
  requestCode: string;
  type: InventoryRequestTypeEnum;
  status: InventoryRequestStatusEnum;
  customerId: string;
  contractId: string;
  facilityId: string;
  facilityCode?: string;
  facilityName?: string;
  storageUnitId: string;
  unitNumber?: string;
  items: InventoryRequestItemResponse[];
  pickupQrToken?: string | null;
  /** PICKUP:{requestCode}:{uuid} (outbound) or INBOUND:{requestCode}:{uuid} (pre-advised inbound) */
  pickupQrPayload?: string | null;
  /** 6-digit OTP, only present in the create-outbound / create-pre-advised response */
  rawOtpCode?: string | null;
  expiresAt?: string | null;
  isVerified: boolean;
  transporterInfo?: InventoryTransporterInfo;
  evidenceImages?: string[];
  signatureUrl?: string | null;
  staffNotes?: string | null;
  discrepancyReason?: string | null;
  discrepancyImages?: string[];
  customerFeedbackNotes?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  completedAt?: string | null;
  completedBy?: string | null;
  cancelledAt?: string | null;
  isAutoConfirmed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VerifiedHandoverDetailsResponse {
  id: string;
  requestCode: string;
  type: InventoryRequestTypeEnum;
  status: InventoryRequestStatusEnum;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  contractId: string;
  facilityId: string;
  storageUnitId: string;
  unitNumber?: string;
  transporterInfo?: InventoryTransporterInfo;
  items: InventoryRequestItemResponse[];
  verifiedAt: string;
  verifiedBy: string;
}

export interface BatchMigrateRackResponse {
  fromRackId: string;
  toRackId: string;
  fromRackCode: string;
  toRackCode: string;
  contractId?: string | null;
  migratedItemsCount: number;
  totalQuantityMigrated: number;
  movementsGenerated: string[];
  message: string;
}

export interface EvacuateRackToHoldingResponse {
  fromRackId: string;
  fromRackCode: string;
  rackStatus: string;
  evacuatedItemsCount: number;
  totalQuantityEvacuated: number;
  movementsGenerated: string[];
  message: string;
}

/** POST /customer-inventories/requests/{id}/regenerate-otp (pending requests only). */
export interface RegenerateOtpResponse {
  requestId: string;
  requestCode: string;
  rawOtpCode: string;
  expiresAt: string;
}
