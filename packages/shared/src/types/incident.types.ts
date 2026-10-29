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
  closedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}
