import type {
  SigningAuthorizationResponse,
  SigningAuthorizationUserRef,
  SigningAuthorizationFacilityRef,
  SigningAuthorizationLegalEntityRef,
  CreateSigningAuthorizationRequest,
  UpdateSigningAuthorizationRequest,
  SigningAuthorizationQuery,
  SigningAuthorizationStatusEnum,
  PaginationMeta,
} from "@self-storage-system-fe/shared";

export type {
  SigningAuthorizationResponse,
  SigningAuthorizationUserRef,
  SigningAuthorizationFacilityRef,
  SigningAuthorizationLegalEntityRef,
  CreateSigningAuthorizationRequest,
  UpdateSigningAuthorizationRequest,
  SigningAuthorizationQuery,
  SigningAuthorizationStatusEnum,
  PaginationMeta,
};

export interface LegalEntityItem {
  _id: string;
  name: string;
  taxCode: string;
  address?: string;
  status?: string;
  representativeName?: string;
  representativePosition?: string;
}

export interface FacilityManagerUserItem {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface FacilitySimpleItem {
  id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
}

export interface SigningAuthorizationFilterParams extends Partial<SigningAuthorizationQuery> {
  search?: string;
}
