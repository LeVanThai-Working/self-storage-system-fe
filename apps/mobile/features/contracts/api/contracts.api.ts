import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  PaymentPurposeEnum,
  type ApiResponse,
  type CancelContractAddendumRequest,
  type ContractQuery,
  type ContractResponse,
  type CreateContractAddendumRequest,
  type CustomerSignContractRequest,
  type PaginatedData,
  type PaginatedResponse,
  type PaginationMeta,
  type PaymentResponse,
  type SignContractAddendumRequest,
} from "@self-storage-system-fe/shared";

const createDefaultPagination = (page = 1, limit = 10): PaginationMeta => ({
  page,
  limit,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
});

function normalizeContractItem(item: ContractResponse): ContractResponse {
  const raw = item as unknown as Record<string, unknown>;
  const resolvedId =
    typeof item.id === "string" && item.id.trim()
      ? item.id
      : typeof raw._id === "string" && raw._id.trim()
        ? raw._id
        : item.id;
  return {
    ...item,
    id: resolvedId,
  };
}

function normalizePaginatedContracts(
  raw:
    ApiResponse<PaginatedData<ContractResponse>> | PaginatedResponse<ContractResponse> | undefined,
  fallbackPage = 1,
  fallbackLimit = 10
): PaginatedData<ContractResponse> {
  if (!raw) {
    return {
      items: [],
      pagination: createDefaultPagination(fallbackPage, fallbackLimit),
    };
  }

  const topPagination = "pagination" in raw ? raw.pagination : undefined;
  const dataField = raw.data as unknown;

  if (Array.isArray(dataField)) {
    return {
      items: (dataField as ContractResponse[]).map(normalizeContractItem),
      pagination: topPagination ?? createDefaultPagination(fallbackPage, fallbackLimit),
    };
  }

  if (dataField && typeof dataField === "object") {
    const nestedObj = dataField as Record<string, unknown>;
    const rawItems = Array.isArray(nestedObj.items)
      ? (nestedObj.items as ContractResponse[])
      : Array.isArray(nestedObj.data)
        ? (nestedObj.data as ContractResponse[])
        : [];
    const nestedPagination = nestedObj.pagination as PaginationMeta | undefined;
    return {
      items: rawItems.map(normalizeContractItem),
      pagination:
        nestedPagination ?? topPagination ?? createDefaultPagination(fallbackPage, fallbackLimit),
    };
  }

  return {
    items: [],
    pagination: topPagination ?? createDefaultPagination(fallbackPage, fallbackLimit),
  };
}

/**
 * 1. GET /contracts
 * Fetches paginated list of contracts belonging to the authenticated customer
 * (including DRAFT contracts awaiting check-in, ACTIVE, OVERDUE, COMPLETED, CANCELLED, TERMINATED).
 */
export async function getMyContractsApi(
  params?: Partial<ContractQuery>
): Promise<PaginatedData<ContractResponse>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;

  const query = cleanQueryParams({
    page,
    limit,
    status: params?.status,
    source: params?.source,
    contractCode: params?.contractCode,
    facilityId: params?.facilityId,
    storageUnitId: params?.storageUnitId,
    startDateFrom: params?.startDateFrom,
    startDateTo: params?.startDateTo,
    endDateFrom: params?.endDateFrom,
    endDateTo: params?.endDateTo,
    sortBy: params?.sortBy ?? "createdAt",
    sortOrder: params?.sortOrder ?? "desc",
  });

  const response = await api.get<
    ApiResponse<PaginatedData<ContractResponse>> | PaginatedResponse<ContractResponse>
  >("/contracts", {
    params: query,
  });

  return normalizePaginatedContracts(response.data, page, limit);
}

/**
 * 2. GET /contracts/{id}
 * Fetches detail of a single contract by ID.
 */
export async function getContractByIdApi(id: string): Promise<ContractResponse> {
  const response = await api.get<ApiResponse<ContractResponse>>(`/contracts/${id}`);
  return normalizeContractItem(response.data.data);
}

/**
 * 3. POST /contracts/{id}/customer-sign
 * Customer independently signs the DRAFT contract after deposit & first-cycle payment are satisfied.
 */
export async function customerSignContractApi(
  id: string,
  payload: CustomerSignContractRequest
): Promise<ContractResponse> {
  const response = await api.post<ApiResponse<ContractResponse>>(`/contracts/${id}/customer-sign`, {
    termsAccepted: payload.termsAccepted,
    notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
  });
  return normalizeContractItem(response.data.data);
}

/**
 * 4. POST /contracts/{id}/addendums
 * Customer creates a Contract Addendum (type = 'add' or 'remove') on an ACTIVE contract.
 */
export async function createContractAddendumApi(
  id: string,
  payload: CreateContractAddendumRequest
): Promise<ContractResponse> {
  const response = await api.post<ApiResponse<ContractResponse>>(`/contracts/${id}/addendums`, {
    type: payload.type,
    amenities: payload.amenities,
    notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
  });
  return normalizeContractItem(response.data.data);
}

/**
 * 5. POST /contracts/{id}/addendums/{addendumId}/customer-sign
 * Customer signs a DRAFT Contract Addendum.
 */
export async function customerSignContractAddendumApi(
  id: string,
  addendumId: string,
  payload: SignContractAddendumRequest
): Promise<ContractResponse> {
  const response = await api.post<ApiResponse<ContractResponse>>(
    `/contracts/${id}/addendums/${addendumId}/customer-sign`,
    {
      termsAccepted: payload.termsAccepted,
      notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
    }
  );
  return normalizeContractItem(response.data.data);
}

/**
 * 6. POST /contracts/{id}/addendums/{addendumId}/cancel
 * Customer cancels a PENDING_APPROVAL or DRAFT Contract Addendum.
 */
export async function cancelContractAddendumApi(
  id: string,
  addendumId: string,
  payload: CancelContractAddendumRequest
): Promise<ContractResponse> {
  const response = await api.post<ApiResponse<ContractResponse>>(
    `/contracts/${id}/addendums/${addendumId}/cancel`,
    {
      cancellationReason: payload.cancellationReason.trim(),
    }
  );
  return normalizeContractItem(response.data.data);
}

/**
 * 7. POST /payments
 * Creates or retrieves a payment session (VietQR SePay) for a contract deposit (`CONTRACT_DEPOSIT`).
 */
export async function createContractPaymentApi(
  contractId: string,
  purpose: PaymentPurposeEnum = PaymentPurposeEnum.CONTRACT_DEPOSIT
): Promise<PaymentResponse> {
  const response = await api.post<ApiResponse<PaymentResponse>>("/payments", {
    purpose,
    contractId,
  });
  return response.data.data;
}
