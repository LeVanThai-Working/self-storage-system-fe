import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignStorageUnitToReservation,
  cancelReservation,
  completeReservation,
  confirmManualPayment,
  confirmReservation,
  createOrGetReservationDepositPayment,
  fetchAvailableStorageUnitsForFacility,
  fetchManagerReservations,
  fetchManagerReservationStatusCount,
  fetchPaymentsByReservation,
  fetchReservationById,
  receiveReservation,
  rejectReservation,
} from "./api";
import {
  ReservationStatusEnum,
  type AssignStorageUnitRequest,
  type AvailableStorageUnitQuery,
  type CancelReservationRequest,
  type ConfirmManualPaymentRequest,
  type ConfirmReservationRequest,
  type ManagerReservationFilterParams,
  type RejectReservationRequest,
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
    enabled: Boolean(params?.facilityId),
    placeholderData: (prev) => prev,
  });

export const useManagerReservationStats = (facilityId: string | undefined) => {
  const enabled = Boolean(facilityId);
  const results = useQueries({
    queries: [
      {
        queryKey: [STATS_KEY, facilityId, "all"],
        queryFn: () => fetchManagerReservationStatusCount(facilityId!),
        enabled,
      },
      {
        queryKey: [STATS_KEY, facilityId, ReservationStatusEnum.PENDING],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId!, ReservationStatusEnum.PENDING),
        enabled,
      },
      {
        queryKey: [STATS_KEY, facilityId, ReservationStatusEnum.RECEIVED],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId!, ReservationStatusEnum.RECEIVED),
        enabled,
      },
      {
        queryKey: [STATS_KEY, facilityId, ReservationStatusEnum.PENDING_PAYMENT],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId!, ReservationStatusEnum.PENDING_PAYMENT),
        enabled,
      },
      {
        queryKey: [STATS_KEY, facilityId, ReservationStatusEnum.PAYMENT_FAILED],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId!, ReservationStatusEnum.PAYMENT_FAILED),
        enabled,
      },
      {
        queryKey: [STATS_KEY, facilityId, ReservationStatusEnum.PAYMENT_SUCCESSFUL],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId!, ReservationStatusEnum.PAYMENT_SUCCESSFUL),
        enabled,
      },
      {
        queryKey: [STATS_KEY, facilityId, ReservationStatusEnum.CONFIRMED],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId!, ReservationStatusEnum.CONFIRMED),
        enabled,
      },
      {
        queryKey: [STATS_KEY, facilityId, ReservationStatusEnum.COMPLETED],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId!, ReservationStatusEnum.COMPLETED),
        enabled,
      },
      {
        queryKey: [STATS_KEY, facilityId, ReservationStatusEnum.CANCELLED],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId!, ReservationStatusEnum.CANCELLED),
        enabled,
      },
      {
        queryKey: [STATS_KEY, facilityId, ReservationStatusEnum.REJECTED],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId!, ReservationStatusEnum.REJECTED),
        enabled,
      },
      {
        queryKey: [STATS_KEY, facilityId, ReservationStatusEnum.EXPIRED],
        queryFn: () =>
          fetchManagerReservationStatusCount(facilityId!, ReservationStatusEnum.EXPIRED),
        enabled,
      },
    ],
  });

  const [
    total,
    pending,
    received,
    pendingPayment,
    paymentFailed,
    paymentSuccessful,
    confirmed,
    completed,
    cancelled,
    rejected,
    expired,
  ] = results.map((r) => r.data ?? 0);

  return {
    total,
    pending,
    received,
    awaitingDeposit: pendingPayment + paymentFailed,
    pendingPayment,
    paymentFailed,
    paymentSuccessful,
    confirmed,
    closed: completed + cancelled + rejected + expired,
    completed,
    cancelled,
    rejected,
    expired,
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

function useInvalidateReservationQueries() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
    queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
    queryClient.invalidateQueries({ queryKey: [DETAIL_KEY] });
    queryClient.invalidateQueries({ queryKey: [AVAILABLE_UNITS_KEY] });
    queryClient.invalidateQueries({ queryKey: [RESERVATION_PAYMENTS_KEY] });
    queryClient.invalidateQueries({ queryKey: ["storage-units"] });
    queryClient.invalidateQueries({ queryKey: ["storage-unit-stats"] });
  };
}

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

export const useConfirmReservation = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: ConfirmReservationRequest }) =>
      confirmReservation(id, payload),
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

export const useCompleteReservation = () => {
  const invalidateAll = useInvalidateReservationQueries();
  return useMutation({
    mutationFn: (id: string) => completeReservation(id),
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
