import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignReservationStaff,
  assignStorageUnitToReservation,
  cancelReservation,
  completeReservation,
  confirmManualPayment,
  confirmRefund,
  confirmReservation,
  createOrGetReservationDepositPayment,
  extendGracePeriod,
  fetchAvailableStorageUnitsForFacility,
  fetchManagerReservations,
  fetchManagerReservationStatusCount,
  fetchPaymentsByReservation,
  fetchReservationById,
  forceCancelReservation,
  markCustomerArrived,
  processExpiredReservations,
  processOverdueReservations,
  reassignStorageUnit,
  receiveReservation,
  rejectReservation,
  respondUnitReassign,
} from "./api";
import {
  ReservationStatusEnum,
  type AssignReservationStaffRequest,
  type AssignStorageUnitRequest,
  type AvailableStorageUnitQuery,
  type CancelReservationRequest,
  type ConfirmManualPaymentRequest,
  type ConfirmRefundRequest,
  type ConfirmReservationRequest,
  type ExtendGracePeriodRequest,
  type ForceCancelReservationRequest,
  type ManagerReservationFilterParams,
  type MarkCustomerArrivedRequest,
  type ReassignStorageUnitRequest,
  type RejectReservationRequest,
  type RespondUnitReassignRequest,
} from "./types";

const LIST_KEY = "manager-reservations";
const STATS_KEY = "manager-reservation-stats";
const DETAIL_KEY = "manager-reservation-detail";
const AVAILABLE_UNITS_KEY = "available-storage-units";
const RESERVATION_PAYMENTS_KEY = "manager-reservation-payments";

export const useManagerReservations = (params: ManagerReservationFilterParams | null) =>
  useQuery({
    queryKey: [LIST_KEY, params],
    queryFn: () => fetchManagerReservations(params!),
    enabled: Boolean(params),
    placeholderData: (prev) => prev,
  });

export const useManagerReservationStats = (
  facilityId: string | undefined,
  enabled: boolean = Boolean(facilityId)
) => {
  const statsScopeKey = facilityId ?? "staff-me";
  const results = useQueries({
    queries: [
      {
        queryKey: [STATS_KEY, statsScopeKey, "ALL"],
        queryFn: () => fetchManagerReservationStatusCount(facilityId),
        enabled,
      },
      {
        queryKey: [STATS_KEY, statsScopeKey, ReservationStatusEnum.PENDING_PAYMENT],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId, ReservationStatusEnum.PENDING_PAYMENT),
        enabled,
      },
      {
        queryKey: [STATS_KEY, statsScopeKey, ReservationStatusEnum.PAYMENT_SUCCESSFUL],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId, ReservationStatusEnum.PAYMENT_SUCCESSFUL),
        enabled,
      },
      {
        queryKey: [STATS_KEY, statsScopeKey, ReservationStatusEnum.CONFIRMED],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId, ReservationStatusEnum.CONFIRMED),
        enabled,
      },
      {
        queryKey: [STATS_KEY, statsScopeKey, ReservationStatusEnum.OVERDUE],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId, ReservationStatusEnum.OVERDUE),
        enabled,
      },
      {
        queryKey: [STATS_KEY, statsScopeKey, ReservationStatusEnum.COMPLETED],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId, ReservationStatusEnum.COMPLETED),
        enabled,
      },
      {
        queryKey: [STATS_KEY, statsScopeKey, ReservationStatusEnum.CANCELLED],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId, ReservationStatusEnum.CANCELLED),
        enabled,
      },
      {
        queryKey: [STATS_KEY, statsScopeKey, ReservationStatusEnum.EXPIRED],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId, ReservationStatusEnum.EXPIRED),
        enabled,
      },
    ],
  });

  const [
    total,
    pendingPayment,
    paymentSuccessful,
    confirmed,
    overdue,
    completed,
    cancelled,
    expired,
  ] = results.map((r) => r.data ?? 0);

  return {
    total,
    pendingPayment,
    paymentSuccessful,
    confirmed,
    overdue,
    completed,
    cancelled,
    expired,
    // Aliases for legacy quick tabs if referenced
    pending: 0,
    received: 0,
    awaitingDeposit: pendingPayment,
    closed: completed + cancelled + expired,
    isLoading: results.some((r) => r.isLoading),
  };
};

export const useReservationDetail = (id: string | null) =>
  useQuery({
    queryKey: [DETAIL_KEY, id],
    queryFn: () => fetchReservationById(id!),
    enabled: Boolean(id),
  });

export const useAvailableStorageUnitsForAssignment = (
  facilityId: string | undefined,
  query?: AvailableStorageUnitQuery,
  enabled = true
) =>
  useQuery({
    queryKey: [AVAILABLE_UNITS_KEY, facilityId, query],
    queryFn: () => fetchAvailableStorageUnitsForFacility(facilityId!, query),
    enabled: Boolean(facilityId) && enabled,
  });

export const useReservationPayments = (reservationId: string | null) =>
  useQuery({
    queryKey: [RESERVATION_PAYMENTS_KEY, reservationId],
    queryFn: () => fetchPaymentsByReservation(reservationId!),
    enabled: Boolean(reservationId),
  });

export function useInvalidateReservationQueries() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
    queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
    queryClient.invalidateQueries({ queryKey: [DETAIL_KEY] });
    queryClient.invalidateQueries({ queryKey: [AVAILABLE_UNITS_KEY] });
    queryClient.invalidateQueries({ queryKey: [RESERVATION_PAYMENTS_KEY] });
    queryClient.invalidateQueries({ queryKey: ["storage-units"] });
    queryClient.invalidateQueries({ queryKey: ["storage-unit-stats"] });
    queryClient.invalidateQueries({ queryKey: ["facility-contracts"] });
    queryClient.invalidateQueries({ queryKey: ["facility-contract-stats"] });
    queryClient.invalidateQueries({ queryKey: ["facility-contract-detail"] });
    queryClient.invalidateQueries({ queryKey: ["myReservations"] });
    queryClient.invalidateQueries({ queryKey: ["customerReservation"] });
  };
}

export const useConfirmReservation = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ConfirmReservationRequest }) =>
      confirmReservation(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useAssignReservationStaff = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignReservationStaffRequest }) =>
      assignReservationStaff(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useMarkCustomerArrived = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: MarkCustomerArrivedRequest }) =>
      markCustomerArrived(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useExtendGracePeriod = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ExtendGracePeriodRequest }) =>
      extendGracePeriod(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useReassignStorageUnit = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReassignStorageUnitRequest }) =>
      reassignStorageUnit(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useRespondUnitReassign = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RespondUnitReassignRequest }) =>
      respondUnitReassign(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useCancelReservation = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelReservationRequest }) =>
      cancelReservation(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useForceCancelReservation = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ForceCancelReservationRequest }) =>
      forceCancelReservation(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useConfirmRefund = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ConfirmRefundRequest }) =>
      confirmRefund(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useProcessExpiredReservations = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: () => processExpiredReservations(),
    onSuccess: invalidateAll,
  });
};

export const useProcessOverdueReservations = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: () => processOverdueReservations(),
    onSuccess: invalidateAll,
  });
};

export const useCreateOrGetReservationDepositPayment = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: (reservationId: string) => createOrGetReservationDepositPayment(reservationId),
    onSuccess: invalidateAll,
  });
};

export const useConfirmManualPayment = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: ({
      paymentId,
      payload,
    }: {
      paymentId: string;
      payload: ConfirmManualPaymentRequest;
    }) => confirmManualPayment(paymentId, payload),
    onSuccess: invalidateAll,
  });
};

// Legacy stubs
export const useReceiveReservation = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: (id: string) => receiveReservation(id),
    onSuccess: invalidateAll,
  });
};

export const useAssignStorageUnit = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignStorageUnitRequest }) =>
      assignStorageUnitToReservation(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useRejectReservation = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectReservationRequest }) =>
      rejectReservation(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useCompleteReservation = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: (id: string) => completeReservation(id),
    onSuccess: invalidateAll,
  });
};
