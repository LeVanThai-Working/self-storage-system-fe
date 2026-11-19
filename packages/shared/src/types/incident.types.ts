import type {
  IncidentCategoryEnum,
  IncidentLiablePartyEnum,
  IncidentSeverityEnum,
  IncidentStatusEnum,
} from "../enums/incident.enum";
import type { RoleEnum } from "../enums/user.enum";

export interface TicketUserRef {
  id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
}

export interface TicketFacilityRef {
  id: string;
  code?: string;
  name?: string;
  address?: string;
}

export interface TicketContractRef {
  id: string;
  contractCode?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface IncidentStorageUnitRef {
  id: string;
  unitNumber?: string;
  floor?: number;
  zone?: string;
  status?: string;
}

export interface IncidentStorageRackRef {
  id: string;
  rackCode?: string;
  aisle?: string;
  bay?: number;
  zone?: string;
  status?: string;
}

export interface IncidentRackTierRef {
  id: string;
  tierNumber?: number;
  status?: string;
}

export interface IncidentResolutionResponse {
  investigationNotes?: string;
  staffEvidenceImages: string[];
  resolutionNotes: string;
  repairCost: number;
  liableParty: IncidentLiablePartyEnum;
  damageFee: number;
  resolvedBy: TicketUserRef | string;
  resolvedAt: string;
}

export interface IncidentResponse {
  id: string;
  /** INC-YYYYMMDD-0001 */
  incidentCode: string;
  facility: TicketFacilityRef | string;
  locationType?: "storage_unit" | "storage_rack" | "common_area";
  commonAreaLocation?: string | null;
  storageUnit?: IncidentStorageUnitRef | null;
  storageRack?: IncidentStorageRackRef | null;
  rackTier?: IncidentRackTierRef | null;
  contract?: TicketContractRef | null;
  reporter: TicketUserRef | string;
  reporterRole: RoleEnum;
  category: IncidentCategoryEnum;
  severity: IncidentSeverityEnum;
  title: string;
  description: string;
  images: string[];
  status: IncidentStatusEnum;
  assignedStaff?: TicketUserRef | null;
  putUnitUnderMaintenance: boolean;
  requiresRelocation: boolean;
  investigationNotes?: string | null;
  resolution?: IncidentResolutionResponse | null;
  preEvacuationManifest?: PreEvacuationManifestResponse | null;
  restorationManifestDocUrl?: string | null;
  restorationUploadedAt?: string | null;
  restorationUploadedBy?: TicketUserRef | string | null;
  customerAcknowledgedAt?: string | null;
  customerAcknowledgedBy?: TicketUserRef | string | null;
  customerAcknowledgeNotes?: string | null;
  readyAt?: string | null;
  closedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PreEvacuationItem {
  skuId: string;
  skuCode?: string;
  skuName?: string;
  systemQuantity: number;
  actualQuantity: number;
  discrepancy: number;
  condition?: string;
  notes?: string;
}

export interface PreEvacuationManifestResponse {
  evacuatedAt: string;
  evacuatedBy: TicketUserRef | string;
  evidenceImages: string[];
  items: PreEvacuationItem[];
  totalSystemQuantity: number;
  totalActualQuantity: number;
  totalDiscrepancy: number;
  notes?: string;
}
