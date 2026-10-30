import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveRefundRequest,
  cancelRefundRequest,
  confirmPaidRefund,
  createRefundRequest,
  fetchRefundRequestById,
  fetchRefundRequests,
  rejectRefundRequest,
} from "./api";
import type {
  ApproveRefundRequest,
  CancelRefundRequest,
  ConfirmPaidRefund,
  CreateRefundRequest,
  RefundRequestQuery,
  RejectRefundRequest,
} from "./types";

export const REFUND_REQUESTS_KEY = "refund-requests";
export const REFUND_REQUEST_DETAIL_KEY = "refund-request-detail";

export function useRefundRequests(params?: Partial<RefundRequestQuery>) {
  return useQuery({
    queryKey: [REFUND_REQUESTS_KEY, params],
    queryFn: () => fetchRefundRequests(params),
  });
}

export function useRefundRequestDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: [REFUND_REQUEST_DETAIL_KEY, id],
    queryFn: () => fetchRefundRequestById(id!),
    enabled: Boolean(id),
  });
}

export function useInvalidateRefundQueries() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [REFUND_REQUESTS_KEY] });
    queryClient.invalidateQueries({ queryKey: [REFUND_REQUEST_DETAIL_KEY] });
    queryClient.invalidateQueries({ queryKey: ["manager-reservations"] });
    queryClient.invalidateQueries({ queryKey: ["manager-reservation-detail"] });
    queryClient.invalidateQueries({ queryKey: ["facility-contracts"] });
    queryClient.invalidateQueries({ queryKey: ["facility-contract-detail"] });
    queryClient.invalidateQueries({ queryKey: ["myReservations"] });
    queryClient.invalidateQueries({ queryKey: ["customerReservation"] });
  };
}

export function useCreateRefundRequest() {
  const invalidate = useInvalidateRefundQueries();
  return useMutation({
    mutationFn: (payload: CreateRefundRequest) => createRefundRequest(payload),
    onSuccess: invalidate,
  });
}

export function useApproveRefundRequest() {
  const invalidate = useInvalidateRefundQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: ApproveRefundRequest }) =>
      approveRefundRequest(id, payload),
    onSuccess: invalidate,
  });
}

export function useRejectRefundRequest() {
  const invalidate = useInvalidateRefundQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectRefundRequest }) =>
      rejectRefundRequest(id, payload),
    onSuccess: invalidate,
  });
}

export function useConfirmPaidRefund() {
  const invalidate = useInvalidateRefundQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ConfirmPaidRefund }) =>
      confirmPaidRefund(id, payload),
    onSuccess: invalidate,
  });
}

export function useCancelRefundRequest() {
  const invalidate = useInvalidateRefundQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelRefundRequest }) =>
      cancelRefundRequest(id, payload),
    onSuccess: invalidate,
  });
}
