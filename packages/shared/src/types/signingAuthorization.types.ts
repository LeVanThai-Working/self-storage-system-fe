import type { SigningAuthorizationStatusEnum } from "../enums/signingAuthorization.enum";
import type { PaginatedData } from "./common.types";

export interface SigningAuthorizationUserRef {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface SigningAuthorizationFacilityRef {
  _id: string;
  name: string;
  code: string;
  address: string;
}

export interface SigningAuthorizationLegalEntityRef {
  _id: string;
  name: string;
  taxCode: string;
  address: string;
  representativeName?: string;
  representativePosition?: string;
}

export interface SigningAuthorizationResponse {
  id: string;
  legalEntityId: SigningAuthorizationLegalEntityRef | string;
  authorizedUserId: SigningAuthorizationUserRef | string;
  facilityIds: (SigningAuthorizationFacilityRef | string)[];
  authorizationNumber: string;
  issuedDate: string; // ISO 8601
  validFrom: string; // ISO 8601
  validTo: string; // ISO 8601
  documentUrl: string; // URL file scan PDF/ảnh Cloudinary
  fileHash?: string | null;
  status: SigningAuthorizationStatusEnum | "active" | "revoked" | "expired";
  notes?: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export type SigningAuthorizationListResponse = PaginatedData<SigningAuthorizationResponse>;
