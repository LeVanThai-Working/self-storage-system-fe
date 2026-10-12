import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyRequests,
  createApprovalRequest,
  cancelApprovalRequest,
  fetchFacilityAmenityOfferings,
} from "./api";
import type { ApprovalRequestQueryParams, CreateApprovalRequest } from "./types";

export const requestCenterKeys = {
  all: ["approval-requests"] as const,
  myRequests: (filters: ApprovalRequestQueryParams) =>
    [...requestCenterKeys.all, "my-requests", { filters }] as const,
  amenityOfferings: (facilityId: string) => ["facility-amenity-offerings", facilityId] as const,
};

export const useMyRequests = (params?: ApprovalRequestQueryParams) =>
  useQuery({
    queryKey: requestCenterKeys.myRequests(params || {}),
    queryFn: () => fetchMyRequests(params),
  });

export const useCreateApprovalRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateApprovalRequest) => createApprovalRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestCenterKeys.all });
    },
  });
};

export const useCancelApprovalRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelApprovalRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestCenterKeys.all });
    },
  });
};

export const useFacilityAmenityOfferings = (facilityId: string | undefined) =>
  useQuery({
    queryKey: requestCenterKeys.amenityOfferings(facilityId ?? ""),
    queryFn: () => fetchFacilityAmenityOfferings(facilityId!),
    enabled: Boolean(facilityId),
  });
