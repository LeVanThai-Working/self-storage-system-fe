import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignUnmatchedTransaction,
  cancelPayment,
  confirmManualPayment,
  createPayment,
  fetchPaymentById,
  fetchPayments,
  fetchUnmatchedTransactions,
  processExpiredPayments,
} from "./api";
import {
  PaymentStatusEnum,
  type AssignUnmatchedTransactionRequest,
  type CancelPaymentRequest,
  type ConfirmManualPaymentRequest,
  type CreatePaymentRequest,
  type PaymentQuery,
  type UnmatchedTransactionQuery,
} from "./types";

export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (params?: PaymentQuery) => [...paymentKeys.lists(), params] as const,
  details: () => [...paymentKeys.all, "detail"] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  unmatchedAll: ["unmatched-transactions"] as const,
  unmatchedList: (params?: UnmatchedTransactionQuery) =>
    [...paymentKeys.unmatchedAll, params] as const,
};

export const usePayments = (
  params?: PaymentQuery,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) => {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => fetchPayments(params),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });
};

export const usePaymentDetail = (
  id?: string,
  options?: { enabled?: boolean; polling?: boolean }
) => {
  const queryClient = useQueryClient();
  const pollingEnabled = options?.polling ?? true;

  return useQuery({
    queryKey: paymentKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("Payment ID is required");
      const payment = await fetchPaymentById(id);
      if (payment.status === PaymentStatusEnum.PAID) {
        if (payment.contractId) {
          queryClient.invalidateQueries({ queryKey: ["contracts", payment.contractId] });
          queryClient.invalidateQueries({ queryKey: ["contracts"] });
        }
        if (payment.reservationId) {
          queryClient.invalidateQueries({ queryKey: ["reservations", payment.reservationId] });
          queryClient.invalidateQueries({ queryKey: ["reservations"] });
        }
      }
      return payment;
    },
    enabled: Boolean(id) && (options?.enabled ?? true),
    refetchInterval: (query) => {
      if (!pollingEnabled) return false;
      const status = query.state.data?.status;
      return status === PaymentStatusEnum.PENDING ? 2500 : false;
    },
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePaymentRequest) => createPayment(payload),
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      if (payment.contractId) {
        queryClient.invalidateQueries({ queryKey: ["contracts", payment.contractId] });
      }
      if (payment.reservationId) {
        queryClient.invalidateQueries({ queryKey: ["reservations", payment.reservationId] });
      }
    },
  });
};

export const useCancelPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelPaymentRequest }) =>
      cancelPayment(id, payload),
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(payment.id) });
      if (payment.contractId) {
        queryClient.invalidateQueries({ queryKey: ["contracts", payment.contractId] });
      }
      if (payment.reservationId) {
        queryClient.invalidateQueries({ queryKey: ["reservations", payment.reservationId] });
      }
    },
  });
};

export const useConfirmManualPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ConfirmManualPaymentRequest }) =>
      confirmManualPayment(id, payload),
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(payment.id) });
      if (payment.contractId) {
        queryClient.invalidateQueries({ queryKey: ["contracts", payment.contractId] });
        queryClient.invalidateQueries({ queryKey: ["contracts"] });
      }
      if (payment.reservationId) {
        queryClient.invalidateQueries({ queryKey: ["reservations", payment.reservationId] });
        queryClient.invalidateQueries({ queryKey: ["reservations"] });
      }
    },
  });
};

export const useUnmatchedTransactions = (
  params?: UnmatchedTransactionQuery,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: paymentKeys.unmatchedList(params),
    queryFn: () => fetchUnmatchedTransactions(params),
    enabled: options?.enabled ?? true,
  });
};

export const useAssignUnmatchedTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      transactionId,
      payload,
    }: {
      transactionId: string;
      payload: AssignUnmatchedTransactionRequest;
    }) => assignUnmatchedTransaction(transactionId, payload),
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: paymentKeys.unmatchedAll });
      if (payment.contractId) {
        queryClient.invalidateQueries({ queryKey: ["contracts", payment.contractId] });
      }
      if (payment.reservationId) {
        queryClient.invalidateQueries({ queryKey: ["reservations", payment.reservationId] });
      }
    },
  });
};

export const useProcessExpiredPayments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => processExpiredPayments(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
};
