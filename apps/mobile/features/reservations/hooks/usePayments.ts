import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PaymentStatusEnum,
  type CancelPaymentRequest,
  type PaymentQuery,
  type PaymentResponse,
} from "@self-storage-system-fe/shared";
import {
  cancelPaymentApi,
  createOrGetDepositPaymentApi,
  getMyPaymentsApi,
  getPaymentByIdApi,
} from "../api/payments.api";

/**
 * Calls `POST /payments` with `{ purpose: 'reservation_deposit', reservationId }`
 * to initialize or resume an active VietQR deposit payment session.
 */
export function useCreateOrGetDepositPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: string) => createOrGetDepositPaymentApi(reservationId),
    onSuccess: (res) => {
      if (res.data?.id) {
        queryClient.setQueryData(["payment-detail", res.data.id], res.data);
      }
    },
  });
}

/**
 * Polls `GET /payments/{id}` every `pollingIntervalMs` (default 4000ms) while:
 * 1. `enabled` is true (screen is focused & app is active)
 * 2. Payment `status` is still `PENDING` or `PARTIALLY_PAID`
 */
export function usePaymentPolling(options: {
  paymentId?: string | null;
  initialPayment?: PaymentResponse | null;
  enabled?: boolean;
  pollingIntervalMs?: number;
}) {
  const { paymentId, initialPayment, enabled = true, pollingIntervalMs = 4000 } = options;

  return useQuery({
    queryKey: ["payment-detail", paymentId],
    queryFn: () => getPaymentByIdApi(paymentId!),
    initialData: initialPayment ?? undefined,
    enabled: Boolean(paymentId) && enabled,
    refetchInterval: (query) => {
      if (!enabled) return false;
      const currentStatus = query.state.data?.status;
      if (
        currentStatus === PaymentStatusEnum.PENDING ||
        currentStatus === PaymentStatusEnum.PARTIALLY_PAID
      ) {
        return pollingIntervalMs;
      }
      return false;
    },
    refetchIntervalInBackground: false,
  });
}

/**
 * Cancels an active payment session (`POST /payments/{id}/cancel`).
 */
export function useCancelPayment(reservationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { paymentId: string; payload: CancelPaymentRequest }) =>
      cancelPaymentApi(params.paymentId, params.payload),
    onSuccess: (res, variables) => {
      if (res.data) {
        queryClient.setQueryData(["payment-detail", variables.paymentId], res.data);
      }
      queryClient.invalidateQueries({ queryKey: ["payment-detail", variables.paymentId] });
      if (reservationId) {
        queryClient.invalidateQueries({ queryKey: ["reservation-detail", reservationId] });
      }
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["my-payments"] });
    },
  });
}

/**
 * Fetches paginated customer payments (`GET /payments`).
 */
export function useMyPayments(params?: Partial<PaymentQuery>, enabled = true) {
  return useQuery({
    queryKey: ["my-payments", params ?? {}],
    queryFn: () => getMyPaymentsApi(params),
    enabled,
  });
}
