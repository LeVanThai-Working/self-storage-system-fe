import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelRefundRequestApi,
  fetchCustomerRefundRequests,
  fetchRefundRequestById,
} from "../api/refunds.api";
import type { RefundRequestQuery } from "@self-storage-system-fe/shared";

export const CUSTOMER_REFUNDS_KEY = "customer-refunds";
export const CUSTOMER_REFUND_DETAIL_KEY = "customer-refund-detail";

export function useCustomerRefunds(params: Partial<RefundRequestQuery> = {}) {
  return useQuery({
    queryKey: [CUSTOMER_REFUNDS_KEY, params],
    queryFn: () => fetchCustomerRefundRequests(params),
  });
}

export function useCustomerRefundDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: [CUSTOMER_REFUND_DETAIL_KEY, id],
    queryFn: () => fetchRefundRequestById(id!),
    enabled: Boolean(id),
  });
}

export function useCancelCustomerRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cancellationReason }: { id: string; cancellationReason: string }) =>
      cancelRefundRequestApi(id, cancellationReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_REFUNDS_KEY] });
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_REFUND_DETAIL_KEY] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}
