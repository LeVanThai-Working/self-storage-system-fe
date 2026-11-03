import type { ApiResponse, PaginatedData } from "./common.types";

export interface LegalRepresentative {
  name: string;
  title: string;
  idNumber?: string | null;
}

export interface LegalEntityBankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface LegalEntityItem {
  id: string;
  companyName: string;
  taxCode: string;
  registeredAddress: string;
  legalRepresentative: LegalRepresentative;
  bankAccount: LegalEntityBankAccount;
  phone?: string | null;
  email?: string | null;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export type LegalEntityResponse = ApiResponse<LegalEntityItem>;
export type LegalEntityListResponse = ApiResponse<PaginatedData<LegalEntityItem>>;
