import api from "@/lib/api/axios";
import type {
  UnitTypeQueryParams,
  UnitTypeListResponse,
  UnitTypeItem,
  CreateUnitTypeRequest,
  UpdateUnitTypeRequest,
} from "./types";

/**
 * Lấy danh sách toàn bộ quy cách kho chuẩn (Unit Types) kèm phân trang, tìm kiếm và bộ lọc.
 * Endpoint: GET /unit-types
 * Query: page, limit, sortBy, sortOrder, search, category, status, minArea, maxArea
 */
export const fetchUnitTypes = async (
  params?: UnitTypeQueryParams
): Promise<UnitTypeListResponse> => {
  const queryParams: Record<string, unknown> = {
    page: params?.page || 1,
    limit: params?.limit || 10,
    sortBy: params?.sortBy || "createdAt",
    sortOrder: params?.sortOrder || "desc",
  };

  if (params?.search && params.search.trim()) {
    queryParams.search = params.search.trim();
  }
  if (params?.category && params.category !== "ALL") {
    queryParams.category = params.category;
  }
  if (params?.status && params.status !== "ALL") {
    queryParams.status = params.status;
  }
  if (typeof params?.minArea === "number") {
    queryParams.minArea = params.minArea;
  }
  if (typeof params?.maxArea === "number") {
    queryParams.maxArea = params.maxArea;
  }

  const { data } = await api.get<{
    success: boolean;
    data: UnitTypeListResponse;
  }>("/unit-types", { params: queryParams });

  return {
    items: data.data?.items || [],
    pagination: data.data?.pagination || {
      page: Number(queryParams.page),
      limit: Number(queryParams.limit),
      totalItems: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
};

/**
 * Lấy chi tiết quy cách kho theo ID
 * Endpoint: GET /unit-types/:id
 */
export const fetchUnitTypeById = async (id: string): Promise<UnitTypeItem> => {
  const { data } = await api.get<{
    success: boolean;
    data: UnitTypeItem;
  }>(`/unit-types/${id}`);
  return data.data;
};

/**
 * Tạo mới quy cách kho chuẩn
 * Endpoint: POST /unit-types
 */
export const createUnitType = async (payload: CreateUnitTypeRequest): Promise<UnitTypeItem> => {
  const { data } = await api.post<{
    success: boolean;
    data: UnitTypeItem;
  }>("/unit-types", payload);
  return data.data;
};

/**
 * Cập nhật thông tin quy cách kho
 * Endpoint: PATCH /unit-types/:id
 */
export const updateUnitType = async (
  id: string,
  payload: UpdateUnitTypeRequest
): Promise<UnitTypeItem> => {
  const { data } = await api.patch<{
    success: boolean;
    data: UnitTypeItem;
  }>(`/unit-types/${id}`, payload);
  return data.data;
};

/**
 * Xóa mềm / Vô hiệu hóa quy cách kho
 * Endpoint: DELETE /unit-types/:id
 */
export const deleteUnitType = async (id: string): Promise<null> => {
  const { data } = await api.delete<{
    success: boolean;
    data: null;
  }>(`/unit-types/${id}`);
  return data.data;
};

/**
 * Khôi phục quy cách kho đã bị vô hiệu hóa
 * Endpoint: POST /unit-types/:id/restore
 */
export const restoreUnitType = async (id: string): Promise<UnitTypeItem> => {
  const { data } = await api.post<{
    success: boolean;
    data: UnitTypeItem;
  }>(`/unit-types/${id}/restore`);
  return data.data;
};
