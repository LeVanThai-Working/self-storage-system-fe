import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  CreateOutboundRequest,
  CreatePreAdvisedInboundRequest,
  InventoryRequestQuery,
  InventoryRequestResponse,
} from "@self-storage-system-fe/shared";
import { invalidateInventoryViews } from "@/features/customer-inventory/hooks/useCustomerInventory";
import {
  cancelInboundRequestApi,
  cancelOutboundRequestApi,
  confirmInboundRequestApi,
  createOutboundRequestApi,
  createPreAdvisedInboundApi,
  disputeInboundRequestApi,
  getInventoryRequestApi,
  getInventoryRequestsApi,
  regenerateOtpApi,
} from "../api/inventoryRequest.api";
import { usePickupOtpStore } from "../stores/pickupOtp.store";

export const inventoryRequestKeys = {
  all: ["inventory-requests"] as const,
  list: (query: Partial<InventoryRequestQuery>) =>
    [...inventoryRequestKeys.all, "list", query] as const,
  detail: (id?: string) => [...inventoryRequestKeys.all, "detail", id] as const,
};

function onRequestChanged(qc: QueryClient, request: InventoryRequestResponse) {
  qc.setQueryData(inventoryRequestKeys.detail(request.id), request);
  qc.invalidateQueries({ queryKey: [...inventoryRequestKeys.all, "list"] });
}

export function useInventoryRequests(query: Partial<InventoryRequestQuery>, enabled = true) {
  return useQuery({
    queryKey: inventoryRequestKeys.list(query),
    queryFn: () => getInventoryRequestsApi(query),
    enabled,
  });
}

export function useInventoryRequest(id?: string) {
  return useQuery({
    queryKey: inventoryRequestKeys.detail(id),
    queryFn: () => getInventoryRequestApi(id!),
    enabled: Boolean(id),
  });
}

export function useCreateOutboundRequest() {
  const qc = useQueryClient();
  const remember = usePickupOtpStore((state) => state.remember);
  return useMutation({
    mutationFn: (payload: CreateOutboundRequest) => createOutboundRequestApi(payload),
    onSuccess: (request) => {
      if (request.rawOtpCode) remember(request.id, request.rawOtpCode);
      onRequestChanged(qc, { ...request, rawOtpCode: null });
    },
  });
}

export function useCancelOutboundRequest(id: string) {
  const qc = useQueryClient();
  const forget = usePickupOtpStore((state) => state.forget);
  return useMutation({
    mutationFn: (reason?: string) => cancelOutboundRequestApi(id, { reason }),
    onSuccess: (request) => {
      forget(id);
      onRequestChanged(qc, request);
    },
  });
}

export function useConfirmInboundRequest(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => confirmInboundRequestApi(id),
    onSuccess: (request) => {
      onRequestChanged(qc, request);
      // Confirming may complete the request and add stock straight away.
      invalidateInventoryViews(qc, request.storageUnitId);
    },
  });
}

export function useDisputeInboundRequest(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (disputeReason: string) => disputeInboundRequestApi(id, { disputeReason }),
    onSuccess: (request) => onRequestChanged(qc, request),
  });
}

export function useCreatePreAdvisedInbound() {
  const qc = useQueryClient();
  const remember = usePickupOtpStore((state) => state.remember);
  return useMutation({
    mutationFn: (payload: CreatePreAdvisedInboundRequest) => createPreAdvisedInboundApi(payload),
    onSuccess: (request) => {
      if (request.rawOtpCode) remember(request.id, request.rawOtpCode);
      onRequestChanged(qc, { ...request, rawOtpCode: null });
    },
  });
}

export function useCancelInboundRequest(id: string) {
  const qc = useQueryClient();
  const forget = usePickupOtpStore((state) => state.forget);
  return useMutation({
    mutationFn: (reason?: string) => cancelInboundRequestApi(id, { reason }),
    onSuccess: (request) => {
      forget(id);
      onRequestChanged(qc, request);
    },
  });
}

/** Issues a fresh OTP (the old one stops working) and keeps it in memory like on create. */
export function useRegenerateOtp(id: string) {
  const qc = useQueryClient();
  const remember = usePickupOtpStore((state) => state.remember);
  return useMutation({
    mutationFn: () => regenerateOtpApi(id),
    onSuccess: (result) => {
      remember(id, result.rawOtpCode);
      qc.invalidateQueries({ queryKey: inventoryRequestKeys.detail(id) });
    },
  });
}
