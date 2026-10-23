import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFacilityAmenityOfferings,
  fetchAvailableFacilityAmenities,
  fetchFacilityAmenityOfferingById,
  fetchFacilityAmenityLookup,
  createFacilityAmenityOffering,
  updateFacilityAmenityOffering,
  deleteFacilityAmenityOffering,
  restoreFacilityAmenityOffering,
} from "./api";
import type {
  FacilityAmenityOfferingQueryParams,
  CreateFacilityAmenityOfferingRequest,
  UpdateFacilityAmenityOfferingRequest,
} from "./types";

export const facilityAmenityOfferingKeys = {
  all: ["facility-amenity-offerings"] as const,
  lists: () => [...facilityAmenityOfferingKeys.all, "list"] as const,
  list: (filters: FacilityAmenityOfferingQueryParams) =>
    [...facilityAmenityOfferingKeys.lists(), { filters }] as const,
  availableLists: () => [...facilityAmenityOfferingKeys.all, "available"] as const,
  availableByFacility: (facilityId: string) =>
    [...facilityAmenityOfferingKeys.availableLists(), facilityId] as const,
  details: () => [...facilityAmenityOfferingKeys.all, "detail"] as const,
  detail: (id: string) => [...facilityAmenityOfferingKeys.details(), id] as const,
  lookup: (facilityId: string, amenityId: string) =>
    [...facilityAmenityOfferingKeys.all, "lookup", { facilityId, amenityId }] as const,
};

/**
 * Lấy danh sách phân bổ tiện ích cho các cơ sở.
 * Endpoint: GET /facility-amenity-offerings
 */
export const useFacilityAmenityOfferings = (params?: FacilityAmenityOfferingQueryParams) => {
  return useQuery({
    queryKey: facilityAmenityOfferingKeys.list(params || {}),
    queryFn: () => fetchFacilityAmenityOfferings(params),
  });
};

/**
 * Lấy danh sách các tiện ích còn chỗ trống tại một cơ sở (availableQuantity > 0).
 * Endpoint: GET /facility-amenity-offerings/facility/{facilityId}/available
 */
export const useAvailableFacilityAmenities = (
  facilityId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: facilityAmenityOfferingKeys.availableByFacility(facilityId),
    queryFn: () => fetchAvailableFacilityAmenities(facilityId),
    enabled: Boolean(facilityId) && (options?.enabled ?? true),
  });
};

/**
 * Lấy chi tiết một tiện ích phân bổ theo ID.
 * Endpoint: GET /facility-amenity-offerings/{id}
 */
export const useFacilityAmenityOffering = (id: string | null, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: facilityAmenityOfferingKeys.detail(id || ""),
    queryFn: () => fetchFacilityAmenityOfferingById(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
};

/**
 * Tra cứu nhanh xem tiện ích đã được gán vào cơ sở đó chưa (tránh trùng lặp khi thêm mới).
 * Endpoint: GET /facility-amenity-offerings/facility/{facilityId}/amenity/{amenityId}
 */
export const useCheckFacilityAmenityOffering = (
  facilityId?: string,
  amenityId?: string,
  options?: { enabled?: boolean }
) => {
  const isEnabled = Boolean(facilityId && amenityId) && (options?.enabled ?? true);
  return useQuery({
    queryKey: facilityAmenityOfferingKeys.lookup(facilityId || "", amenityId || ""),
    queryFn: () => fetchFacilityAmenityLookup(facilityId!, amenityId!),
    enabled: isEnabled,
    retry: false,
  });
};

/**
 * Tạo mới phân bổ tiện ích cho cơ sở & cấu hình giá ban đầu.
 * Endpoint: POST /facility-amenity-offerings
 */
export const useCreateFacilityAmenityOffering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFacilityAmenityOfferingRequest) =>
      createFacilityAmenityOffering(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facilityAmenityOfferingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: facilityAmenityOfferingKeys.availableLists() });
    },
  });
};

/**
 * Chỉnh sửa số lượng trang bị (totalQuantity) & Đơn giá thuê.
 * Endpoint: PATCH /facility-amenity-offerings/{id}
 */
export const useUpdateFacilityAmenityOffering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFacilityAmenityOfferingRequest }) =>
      updateFacilityAmenityOffering(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: facilityAmenityOfferingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: facilityAmenityOfferingKeys.availableLists() });
      queryClient.invalidateQueries({ queryKey: facilityAmenityOfferingKeys.detail(variables.id) });
    },
  });
};

/**
 * Xóa mềm / Ngừng cung cấp tiện ích tại cơ sở.
 * Endpoint: DELETE /facility-amenity-offerings/{id}
 */
export const useDeleteFacilityAmenityOffering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFacilityAmenityOffering(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: facilityAmenityOfferingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: facilityAmenityOfferingKeys.availableLists() });
      queryClient.invalidateQueries({ queryKey: facilityAmenityOfferingKeys.detail(id) });
    },
  });
};

/**
 * Khôi phục tiện ích đã bị ngừng cung cấp / xóa mềm.
 * Endpoint: POST /facility-amenity-offerings/{id}/restore
 */
export const useRestoreFacilityAmenityOffering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreFacilityAmenityOffering(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: facilityAmenityOfferingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: facilityAmenityOfferingKeys.availableLists() });
      queryClient.invalidateQueries({ queryKey: facilityAmenityOfferingKeys.detail(id) });
    },
  });
};
