import type { ApiResponse, PaginatedData, PaginationMeta } from "@self-storage-system-fe/shared";
import api from "@/lib/api/axios";
import {
  PaymentPurposeEnum,
  UserStatusEnum,
  type ApproveContractAddendumRequest,
  type CancelContractAddendumRequest,
  type CancelContractRequest,
  type CheckInContractRequest,
  type CheckOutContractRequest,
  type ConfirmManualPaymentRequest,
  type ContractFilterParams,
  type ContractPaginatedData,
  type ContractResponse,
  type CreateContractAddendumRequest,
  type CreateContractRequest,
  type FacilityStaffItem,
  type FacilityStaffPaginatedData,
  type FacilityStaffQuery,
  type PaymentMethodEnum,
  type PaymentPaginatedData,
  type PaymentResponse,
  type RejectContractAddendumRequest,
  type RenewContractRequest,
  type SignContractAddendumRequest,
  type StorageUnitResponse,
  type TerminateContractRequest,
  type ToggleMaintenanceRequest,
} from "./types";
import { isContractAssignedToStaff } from "./utils";

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

/**
 * Chuẩn hóa kết quả phân trang từ BE (hỗ trợ cả cấu trúc `{ data: { items, pagination } }`
 * lẫn `{ data: T[], pagination }`).
 */
function normalizePaginatedEnvelope<T>(
  rawEnvelope: unknown,
  fallbackPage = 1,
  fallbackLimit = 10
): PaginatedData<T> {
  if (!rawEnvelope || typeof rawEnvelope !== "object") {
    return {
      items: [],
      pagination: { ...DEFAULT_PAGINATION, page: fallbackPage, limit: fallbackLimit },
    };
  }

  const env = rawEnvelope as Record<string, unknown>;
  const innerData = env.data;

  if (Array.isArray(innerData)) {
    const pagination = (env.pagination as PaginationMeta | undefined) ?? {
      ...DEFAULT_PAGINATION,
      page: fallbackPage,
      limit: fallbackLimit,
      totalItems: innerData.length,
    };
    return {
      items: innerData as T[],
      pagination,
    };
  }

  if (innerData && typeof innerData === "object") {
    const innerObj = innerData as Record<string, unknown>;
    const items = Array.isArray(innerObj.items)
      ? (innerObj.items as T[])
      : Array.isArray(innerObj.data)
        ? (innerObj.data as T[])
        : [];
    const pagination = (innerObj.pagination as PaginationMeta | undefined) ??
      (env.pagination as PaginationMeta | undefined) ?? {
        ...DEFAULT_PAGINATION,
        page: fallbackPage,
        limit: fallbackLimit,
        totalItems: items.length,
      };
    return {
      items,
      pagination,
    };
  }

  return {
    items: [],
    pagination: { ...DEFAULT_PAGINATION, page: fallbackPage, limit: fallbackLimit },
  };
}

/**
 * 1. GET /my-facility/staffs — Lấy danh sách nhân viên cơ sở (Dành cho FACILITY_MANAGER)
 */
export async function fetchFacilityStaffs(
  query?: FacilityStaffQuery
): Promise<FacilityStaffPaginatedData> {
  const params: Record<string, string | number> = {
    page: query?.page ?? 1,
    limit: query?.limit ?? 100,
    status: query?.status ?? UserStatusEnum.ACTIVE,
    sortBy: query?.sortBy ?? "name",
    sortOrder: query?.sortOrder ?? "asc",
  };
  if (query?.search?.trim()) {
    params.search = query.search.trim();
  }

  const { data } = await api.get("/my-facility/staffs", { params });
  return normalizePaginatedEnvelope<FacilityStaffItem>(
    data,
    Number(params.page),
    Number(params.limit)
  );
}

/**
 * 2.1. POST /contracts — Tạo hợp đồng mới (DRAFT) từ Reservation hoặc Walk-in
 */
export async function createContract(payload: CreateContractRequest): Promise<ContractResponse> {
  const { data } = await api.post<ApiResponse<ContractResponse>>("/contracts", payload);
  return data.data;
}

/**
 * 2.2. GET /contracts — Danh sách hợp đồng tại cơ sở
 */
export async function fetchContracts(params: ContractFilterParams): Promise<ContractPaginatedData> {
  const requestedPage = params.page ?? 1;
  const requestedLimit = params.limit ?? 10;

  const query: Record<string, string | number> = {
    page: params.assignedStaffId ? 1 : requestedPage,
    limit: params.assignedStaffId ? Math.max(requestedLimit, 100) : requestedLimit,
    sortBy: params.sortBy ?? "createdAt",
    sortOrder: params.sortOrder ?? "desc",
  };

  if (params.facilityId) query.facilityId = params.facilityId;
  if (params.customerId?.trim()) query.customerId = params.customerId.trim();
  if (params.storageUnitId) query.storageUnitId = params.storageUnitId;
  if (params.assignedStaffId) query.assignedStaffId = params.assignedStaffId;
  if (params.status) query.status = params.status;
  if (params.source) query.source = params.source;
  if (params.contractCode?.trim()) query.contractCode = params.contractCode.trim();

  const { data } = await api.get("/contracts", { params: query });
  const normalized = normalizePaginatedEnvelope<ContractResponse>(
    data,
    Number(query.page),
    Number(query.limit)
  );

  if (params.assignedStaffId) {
    const filteredItems = normalized.items.filter((item) =>
      isContractAssignedToStaff(item, params.assignedStaffId)
    );
    const totalItems = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / requestedLimit));
    const safePage = Math.min(requestedPage, totalPages);
    const startIdx = (safePage - 1) * requestedLimit;
    const pagedItems = filteredItems.slice(startIdx, startIdx + requestedLimit);

    return {
      items: pagedItems,
      pagination: {
        page: safePage,
        limit: requestedLimit,
        totalItems,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  return normalized;
}

/**
 * Đếm số lượng hợp đồng theo trạng thái (phục vụ badge số lượng trên các Tab)
 */
export async function fetchContractCount(params: Partial<ContractFilterParams>): Promise<number> {
  const query: Record<string, string | number> = {
    page: 1,
    limit: params.assignedStaffId ? 100 : 1,
  };
  if (params.facilityId) query.facilityId = params.facilityId;
  if (params.status) query.status = params.status;
  if (params.assignedStaffId) query.assignedStaffId = params.assignedStaffId;

  const { data } = await api.get("/contracts", { params: query });
  const normalized = normalizePaginatedEnvelope<ContractResponse>(data, 1, Number(query.limit));

  if (params.assignedStaffId) {
    return normalized.items.filter((item) =>
      isContractAssignedToStaff(item, params.assignedStaffId)
    ).length;
  }

  return normalized.pagination?.totalItems ?? 0;
}

/**
 * 2.3. GET /contracts/{id} — Chi tiết hợp đồng
 */
export async function fetchContractById(id: string): Promise<ContractResponse> {
  const { data } = await api.get<ApiResponse<ContractResponse>>(`/contracts/${id}`);
  return data.data;
}

/**
 * 2.4. POST /contracts/{id}/check-in — Nhân viên xác nhận bàn giao kho & ký (Staff)
 */
export async function checkInContract(
  id: string,
  payload: CheckInContractRequest
): Promise<ContractResponse> {
  const { data } = await api.post<ApiResponse<ContractResponse>>(
    `/contracts/${id}/check-in`,
    payload
  );
  return data.data;
}

/**
 * 2.5. POST /contracts/{id}/cancel — Huỷ hợp đồng nháp (DRAFT -> CANCELLED)
 */
export async function cancelContract(
  id: string,
  payload: CancelContractRequest
): Promise<ContractResponse> {
  const { data } = await api.post<ApiResponse<ContractResponse>>(
    `/contracts/${id}/cancel`,
    payload
  );
  return data.data;
}

/**
 * 2.6. POST /contracts/{id}/renew — Gia hạn hợp đồng (ACTIVE / OVERDUE -> ACTIVE)
 */
export async function renewContract(
  id: string,
  payload: RenewContractRequest
): Promise<ContractResponse> {
  const { data } = await api.post<ApiResponse<ContractResponse>>(`/contracts/${id}/renew`, payload);
  return data.data;
}

/**
 * 2.7a. POST /contracts/{id}/addendums — Tạo yêu cầu Phụ lục hợp đồng (ADD / REMOVE tiện ích)
 */
export async function createContractAddendum(
  id: string,
  payload: CreateContractAddendumRequest
): Promise<ContractResponse> {
  const { data } = await api.post<ApiResponse<ContractResponse>>(
    `/contracts/${id}/addendums`,
    payload
  );
  return data.data;
}

/**
 * 2.7b. POST /contracts/{id}/addendums/{addendumId}/approve — Quản lý duyệt & phân công NV cho Phụ lục
 */
export async function approveContractAddendum(
  id: string,
  addendumId: string,
  payload: ApproveContractAddendumRequest
): Promise<ContractResponse> {
  const { data } = await api.post<ApiResponse<ContractResponse>>(
    `/contracts/${id}/addendums/${addendumId}/approve`,
    payload
  );
  return data.data;
}

/**
 * 2.7c. POST /contracts/{id}/addendums/{addendumId}/reject — Quản lý từ chối Phụ lục
 */
export async function rejectContractAddendum(
  id: string,
  addendumId: string,
  payload: RejectContractAddendumRequest
): Promise<ContractResponse> {
  const { data } = await api.post<ApiResponse<ContractResponse>>(
    `/contracts/${id}/addendums/${addendumId}/reject`,
    payload
  );
  return data.data;
}

/**
 * 2.7d. POST /contracts/{id}/addendums/{addendumId}/staff-sign — Nhân viên/Quản lý xác nhận lắp đặt hoặc tháo dỡ & ký phụ lục
 */
export async function staffSignContractAddendum(
  id: string,
  addendumId: string,
  payload: SignContractAddendumRequest
): Promise<ContractResponse> {
  const { data } = await api.post<ApiResponse<ContractResponse>>(
    `/contracts/${id}/addendums/${addendumId}/staff-sign`,
    payload
  );
  return data.data;
}

/**
 * 2.7e. POST /contracts/{id}/addendums/{addendumId}/cancel — Huỷ yêu cầu Phụ lục (khi đang pending_approval hoặc draft)
 */
export async function cancelContractAddendum(
  id: string,
  addendumId: string,
  payload: CancelContractAddendumRequest
): Promise<ContractResponse> {
  const { data } = await api.post<ApiResponse<ContractResponse>>(
    `/contracts/${id}/addendums/${addendumId}/cancel`,
    payload
  );
  return data.data;
}

/**
 * 2.8. POST /contracts/{id}/check-out — Trả kho & Thanh lý hợp đồng (ACTIVE / OVERDUE -> COMPLETED)
 */
export async function checkOutContract(
  id: string,
  payload: CheckOutContractRequest
): Promise<ContractResponse> {
  const { data } = await api.post<ApiResponse<ContractResponse>>(
    `/contracts/${id}/check-out`,
    payload
  );
  return data.data;
}

/**
 * 2.9. POST /contracts/{id}/terminate — Chấm dứt hợp đồng trước hạn (ACTIVE / OVERDUE -> TERMINATED, Chỉ FACILITY_MANAGER)
 */
export async function terminateContract(
  id: string,
  payload: TerminateContractRequest
): Promise<ContractResponse> {
  const { data } = await api.post<ApiResponse<ContractResponse>>(
    `/contracts/${id}/terminate`,
    payload
  );
  return data.data;
}

/**
 * 3.1. POST /payments — Tạo hoặc lấy phiên thanh toán cọc (purpose: 'contract_deposit') hoặc thu tiền kỳ đầu (purpose: 'contract_first_cycle')
 */
export async function createContractDepositPayment(
  contractId: string,
  _method?: PaymentMethodEnum,
  purpose: PaymentPurposeEnum = PaymentPurposeEnum.CONTRACT_DEPOSIT
): Promise<PaymentResponse> {
  const payload = {
    purpose,
    contractId,
  };
  const { data } = await api.post<ApiResponse<PaymentResponse>>("/payments", payload);
  return data.data;
}

/**
 * Lấy danh sách giao dịch thanh toán theo contractId
 */
export async function fetchPaymentsByContract(contractId: string): Promise<PaymentPaginatedData> {
  const { data } = await api.get("/payments", {
    params: {
      contractId,
      page: 1,
      limit: 20,
    },
  });
  const normalized = normalizePaginatedEnvelope<PaymentResponse>(data, 1, 20);
  const filteredItems = normalized.items.filter((item) => item.contractId === contractId);
  return {
    ...normalized,
    items: filteredItems,
  };
}

/**
 * 3.2. POST /payments/{paymentId}/confirm-manual — Xác nhận thu tiền mặt hoặc chuyển khoản tại quầy
 */
export async function confirmManualContractPayment(
  paymentId: string,
  payload: ConfirmManualPaymentRequest
): Promise<PaymentResponse> {
  const { data } = await api.post<ApiResponse<PaymentResponse>>(
    `/payments/${paymentId}/confirm-manual`,
    payload
  );
  return data.data;
}

/**
 * 3.3. PATCH /storage-units/{id}/maintenance — Mở lại kho sau khi kiểm tra & vệ sinh sau Check-out (UNDER_MAINTENANCE -> AVAILABLE)
 */
export async function toggleStorageUnitMaintenance(
  storageUnitId: string,
  payload: ToggleMaintenanceRequest
): Promise<StorageUnitResponse> {
  const { data } = await api.patch<ApiResponse<StorageUnitResponse>>(
    `/storage-units/${storageUnitId}/maintenance`,
    payload
  );
  return data.data;
}

/**
 * Lấy thông tin chi tiết 1 phòng kho vật lý theo ID
 */
export async function fetchStorageUnitById(storageUnitId: string): Promise<StorageUnitResponse> {
  const { data } = await api.get<ApiResponse<StorageUnitResponse>>(
    `/storage-units/${storageUnitId}`
  );
  return data.data;
}
