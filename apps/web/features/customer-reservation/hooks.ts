import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaymentStatusEnum } from "@self-storage-system-fe/shared";
import {
  cancelReservation,
  createOrGetDepositPayment,
  createReservation,
  fetchAvailableUnits,
  fetchBookableUnits,
  fetchMyReservations,
  fetchOffering,
  fetchPayment,
  fetchReservation,
  fetchUnitRacks,
} from "./api";
import type { ReservationListParams } from "./types";

export const customerReservationKeys = {
  all: ["customer-reservations"] as const,
  list: (params: ReservationListParams) =>
    [...customerReservationKeys.all, "list", params] as const,
  detail: (id: string) => [...customerReservationKeys.all, "detail", id] as const,
  units: (facilityId: string, unitTypeId?: string) =>
    [...customerReservationKeys.all, "units", facilityId, unitTypeId ?? "all"] as const,
  payment: (reservationId: string) =>
    [...customerReservationKeys.all, "payment", reservationId] as const,
  bookableUnits: (facilityId: string, unitTypeId?: string) =>
    [...customerReservationKeys.all, "bookable-units", facilityId, unitTypeId ?? "all"] as const,
  racks: (unitId: string) => [...customerReservationKeys.all, "racks", unitId] as const,
  offering: (offeringId: string) =>
    [...customerReservationKeys.all, "offering", offeringId] as const,
};

/** How often the payment screen asks the BE whether the transfer arrived. */
const PAYMENT_POLL_MS = 4000;

export const useMyReservations = (params: ReservationListParams) =>
  useQuery({
    queryKey: customerReservationKeys.list(params),
    queryFn: () => fetchMyReservations(params),
    placeholderData: keepPreviousData,
  });

export const useReservation = (id: string) =>
  useQuery({
    queryKey: customerReservationKeys.detail(id),
    queryFn: () => fetchReservation(id),
  });

export const useAvailableUnits = (facilityId: string | undefined, unitTypeId?: string) =>
  useQuery({
    queryKey: customerReservationKeys.units(facilityId ?? "", unitTypeId),
    queryFn: () => fetchAvailableUnits(facilityId!, unitTypeId),
    enabled: Boolean(facilityId),
  });

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReservation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerReservationKeys.all }),
  });
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelReservation(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerReservationKeys.all }),
  });
};

/**
 * Opens (or reuses) the deposit payment, then keeps polling it until it is paid, expired or cancelled.
 * Only runs while `enabled` — i.e. while the reservation still waits for its deposit.
 */
export const useDepositPayment = (reservationId: string, enabled: boolean) => {
  const queryClient = useQueryClient();
  const open = useQuery({
    queryKey: [...customerReservationKeys.payment(reservationId), "open"],
    queryFn: () => createOrGetDepositPayment(reservationId),
    enabled,
    staleTime: Infinity,
    retry: false,
  });

  const paymentId = open.data?.id;
  const payment = useQuery({
    queryKey: [...customerReservationKeys.payment(reservationId), "poll", paymentId],
    queryFn: async () => {
      const latest = await fetchPayment(paymentId!);
      if (latest.status === PaymentStatusEnum.PAID) {
        // The reservation flips to "payment_successful" on the BE once the transfer is matched.
        queryClient.invalidateQueries({ queryKey: customerReservationKeys.detail(reservationId) });
      }
      return latest;
    },
    enabled: Boolean(paymentId),
    initialData: open.data,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === PaymentStatusEnum.PENDING || status === PaymentStatusEnum.PARTIALLY_PAID
        ? PAYMENT_POLL_MS
        : false;
    },
  });

  return {
    payment: payment.data ?? open.data,
    isLoading: open.isLoading,
    error: open.error,
    refetch: open.refetch,
  };
};

export const useBookableUnits = (facilityId: string | undefined, unitTypeId?: string) =>
  useQuery({
    queryKey: customerReservationKeys.bookableUnits(facilityId ?? "", unitTypeId),
    queryFn: () => fetchBookableUnits(facilityId!, unitTypeId),
    enabled: Boolean(facilityId),
  });

export const useBookableRacks = (unitId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: customerReservationKeys.racks(unitId ?? ""),
    queryFn: () => fetchUnitRacks(unitId!),
    enabled: Boolean(unitId) && enabled,
  });

/** Zone prices of a rack-warehouse offering. */
export const useOfferingZonePricing = (offeringId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: customerReservationKeys.offering(offeringId ?? ""),
    queryFn: () => fetchOffering(offeringId!),
    enabled: Boolean(offeringId) && enabled,
    select: (offering) => offering.rackZonePricing ?? null,
  });
