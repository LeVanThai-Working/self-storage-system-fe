import api from "@/lib/api/axios";
import type {
  ApiResponse,
  PaginatedData,
  SigningAuthorizationResponse,
  CreateSigningAuthorizationRequest,
  UpdateSigningAuthorizationRequest,
} from "@self-storage-system-fe/shared";
import type {
  LegalEntityItem,
  FacilityManagerUserItem,
  FacilitySimpleItem,
  SigningAuthorizationFilterParams,
} from "./types";
import { formatToBackendDateTime } from "./utils";

/**
 * Lấy danh sách văn bản ủy quyền ký
 * Endpoint: GET /signing-authorizations
 */
export const fetchSigningAuthorizations = async (
  params?: SigningAuthorizationFilterParams
): Promise<PaginatedData<SigningAuthorizationResponse>> => {
  const queryParams: Record<string, unknown> = {
    page: params?.page || 1,
    limit: params?.limit || 10,
    sortBy: params?.sortBy || "createdAt",
    sortOrder: params?.sortOrder || "desc",
  };

  if (params?.status && (params.status as string) !== "ALL") {
    queryParams.status = params.status;
  }
  if (params?.authorizedUserId) {
    queryParams.authorizedUserId = params.authorizedUserId;
  }
  if (params?.legalEntityId) {
    queryParams.legalEntityId = params.legalEntityId;
  }
  if (params?.facilityId) {
    queryParams.facilityId = params.facilityId;
  }

  const { data } = await api.get<ApiResponse<PaginatedData<SigningAuthorizationResponse>>>(
    "/signing-authorizations",
    { params: queryParams }
  );

  return (
    data.data || {
      items: [],
      pagination: {
        page: Number(queryParams.page),
        limit: Number(queryParams.limit),
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    }
  );
};

/**
 * Xem chi tiết văn bản ủy quyền ký
 * Endpoint: GET /signing-authorizations/:id
 */
export const fetchSigningAuthorizationById = async (
  id: string
): Promise<SigningAuthorizationResponse> => {
  const { data } = await api.get<ApiResponse<SigningAuthorizationResponse>>(
    `/signing-authorizations/${id}`
  );
  return data.data;
};

/**
 * Tạo mới văn bản ủy quyền ký
 * Endpoint: POST /signing-authorizations
 */
export const createSigningAuthorization = async (
  payload: CreateSigningAuthorizationRequest
): Promise<SigningAuthorizationResponse> => {
  const formattedPayload: Record<string, unknown> = {
    ...payload,
    issuedDate: formatToBackendDateTime(payload.issuedDate, false),
    validFrom: formatToBackendDateTime(payload.validFrom, false),
    validTo: formatToBackendDateTime(payload.validTo, true),
  };

  // Nếu không có notes, omit key (tránh gửi null)
  if (!formattedPayload.notes) {
    delete formattedPayload.notes;
  }

  const { data } = await api.post<ApiResponse<SigningAuthorizationResponse>>(
    "/signing-authorizations",
    formattedPayload
  );
  return data.data;
};

/**
 * Cập nhật hạn hiệu lực, link tài liệu hoặc ghi chú
 * Endpoint: PATCH /signing-authorizations/:id
 */
export const updateSigningAuthorization = async (
  id: string,
  payload: UpdateSigningAuthorizationRequest
): Promise<SigningAuthorizationResponse> => {
  const formattedPayload: Record<string, unknown> = {
    ...payload,
    ...(payload.validTo !== undefined && {
      validTo: formatToBackendDateTime(payload.validTo, true),
    }),
  };

  // Nếu không có notes, omit key (tránh gửi null)
  if (!formattedPayload.notes) {
    delete formattedPayload.notes;
  }

  const { data } = await api.patch<ApiResponse<SigningAuthorizationResponse>>(
    `/signing-authorizations/${id}`,
    formattedPayload
  );
  return data.data;
};

/**
 * Thu hồi văn bản ủy quyền ký trước hạn
 * Endpoint: POST /signing-authorizations/:id/revoke
 */
export const revokeSigningAuthorization = async (
  id: string
): Promise<SigningAuthorizationResponse> => {
  const { data } = await api.post<ApiResponse<SigningAuthorizationResponse>>(
    `/signing-authorizations/${id}/revoke`
  );
  return data.data;
};

/**
 * Lấy danh sách pháp nhân doanh nghiệp
 * Endpoint: GET /legal-entities
 */
export const fetchLegalEntities = async (): Promise<LegalEntityItem[]> => {
  try {
    const { data } =
      await api.get<
        ApiResponse<PaginatedData<Record<string, unknown>> | Record<string, unknown>[]>
      >("/legal-entities");
    const rawData = data?.data;
    const rawList =
      rawData && "items" in rawData && Array.isArray(rawData.items)
        ? rawData.items
        : Array.isArray(rawData)
          ? rawData
          : [];
    return rawList.map((item) => ({
      _id: String(item._id || item.id || ""),
      name: String(item.companyName || ""),
      taxCode: String(item.taxCode || ""),
      address: String(item.registeredAddress || ""),
      status: typeof item.status === "string" ? item.status : undefined,
      representativeName: (item.legalRepresentative as { name?: string } | undefined)?.name,
      representativePosition: (item.legalRepresentative as { title?: string } | undefined)?.title,
    }));
  } catch (error) {
    console.warn("fetchLegalEntities failed", error);
    return [];
  }
};

/**
 * Lấy danh sách quản lý cơ sở (Facility Managers)
 * Endpoint: GET /users?role=facility_manager
 */
export const fetchFacilityManagersList = async (): Promise<FacilityManagerUserItem[]> => {
  try {
    const { data } = await api.get<
      ApiResponse<PaginatedData<Record<string, unknown>> | Record<string, unknown>[]>
    >("/users", {
      params: { role: "facility_manager", limit: 100 },
    });
    const rawData = data?.data;
    const rawList =
      rawData && "items" in rawData && Array.isArray(rawData.items)
        ? rawData.items
        : Array.isArray(rawData)
          ? rawData
          : [];
    return rawList.map((u) => ({
      id: String(u._id || u.id || ""),
      name: String(u.name || ""),
      email: String(u.email || ""),
      role: String(u.role || ""),
    }));
  } catch (error) {
    console.warn("fetchFacilityManagersList failed", error);
    return [];
  }
};

/**
 * Lấy danh sách cơ sở
 * Endpoint: GET /facilities
 */
export const fetchFacilitiesList = async (): Promise<FacilitySimpleItem[]> => {
  try {
    const { data } = await api.get<
      ApiResponse<PaginatedData<Record<string, unknown>> | Record<string, unknown>[]>
    >("/facilities", {
      params: { limit: 100 },
    });
    const rawData = data?.data;
    const rawList =
      rawData && "items" in rawData && Array.isArray(rawData.items)
        ? rawData.items
        : Array.isArray(rawData)
          ? rawData
          : [];
    return rawList.map((f) => ({
      id: String(f._id || f.id || ""),
      name: String(f.name || ""),
      code: typeof f.code === "string" ? f.code : null,
      address: String(f.address || ""),
      city: typeof f.city === "string" ? f.city : undefined,
    }));
  } catch (error) {
    console.warn("fetchFacilitiesList failed", error);
    return [];
  }
};
