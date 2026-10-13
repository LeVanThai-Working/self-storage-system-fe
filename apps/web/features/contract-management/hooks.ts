import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveContractAddendum,
  cancelContract,
  cancelContractAddendum,
  checkInContract,
  checkOutContract,
  confirmManualContractPayment,
  createContract,
  createContractAddendum,
  createContractDepositPayment,
  fetchContractById,
  fetchContractCount,
  fetchContracts,
  fetchFacilityStaffs,
  fetchPaymentsByContract,
  fetchStorageUnitById,
  rejectContractAddendum,
  renewContract,
  staffSignContractAddendum,
  terminateContract,
  toggleStorageUnitMaintenance,
} from "./api";
import {
  ContractStatusEnum,
  PaymentPurposeEnum,
  type ApproveContractAddendumRequest,
  type CancelContractAddendumRequest,
  type CancelContractRequest,
  type CheckInContractRequest,
  type CheckOutContractRequest,
  type ConfirmManualPaymentRequest,
  type ContractFilterParams,
  type CreateContractAddendumRequest,
  type CreateContractRequest,
  type FacilityStaffQuery,
  type PaymentMethodEnum,
  type RejectContractAddendumRequest,
  type RenewContractRequest,
  type SignContractAddendumRequest,
  type TerminateContractRequest,
  type ToggleMaintenanceRequest,
} from "./types";

const CONTRACTS_LIST_KEY = "facility-contracts";
const CONTRACTS_STATS_KEY = "facility-contract-stats";
const CONTRACT_DETAIL_KEY = "facility-contract-detail";
const FACILITY_STAFFS_KEY = "my-facility-staffs";
const CONTRACT_PAYMENTS_KEY = "contract-payments";
const STORAGE_UNIT_DETAIL_KEY = "storage-unit-detail";

export const useContracts = (params: ContractFilterParams | null, enabled = true) =>
  useQuery({
    queryKey: [CONTRACTS_LIST_KEY, params],
    queryFn: () => fetchContracts(params!),
    enabled: Boolean(params) && enabled,
    placeholderData: (prev) => prev,
  });

export const useContractStats = (
  facilityId?: string,
  assignedStaffId?: string,
  enabledProp = true
) => {
  const enabled = Boolean(facilityId || assignedStaffId) && enabledProp;
  const baseFilter = { facilityId, assignedStaffId };

  const results = useQueries({
    queries: [
      {
        queryKey: [CONTRACTS_STATS_KEY, baseFilter, "all"],
        queryFn: () => fetchContractCount(baseFilter),
        enabled,
      },
      {
        queryKey: [CONTRACTS_STATS_KEY, baseFilter, ContractStatusEnum.DRAFT],
        queryFn: () => fetchContractCount({ ...baseFilter, status: ContractStatusEnum.DRAFT }),
        enabled,
      },
      {
        queryKey: [CONTRACTS_STATS_KEY, baseFilter, ContractStatusEnum.ACTIVE],
        queryFn: () => fetchContractCount({ ...baseFilter, status: ContractStatusEnum.ACTIVE }),
        enabled,
      },
      {
        queryKey: [CONTRACTS_STATS_KEY, baseFilter, ContractStatusEnum.OVERDUE],
        queryFn: () => fetchContractCount({ ...baseFilter, status: ContractStatusEnum.OVERDUE }),
        enabled,
      },
      {
        queryKey: [CONTRACTS_STATS_KEY, baseFilter, ContractStatusEnum.COMPLETED],
        queryFn: () => fetchContractCount({ ...baseFilter, status: ContractStatusEnum.COMPLETED }),
        enabled,
      },
      {
        queryKey: [CONTRACTS_STATS_KEY, baseFilter, ContractStatusEnum.CANCELLED],
        queryFn: () => fetchContractCount({ ...baseFilter, status: ContractStatusEnum.CANCELLED }),
        enabled,
      },
      {
        queryKey: [CONTRACTS_STATS_KEY, baseFilter, ContractStatusEnum.TERMINATED],
        queryFn: () => fetchContractCount({ ...baseFilter, status: ContractStatusEnum.TERMINATED }),
        enabled,
      },
    ],
  });

  const [total, draft, active, overdue, completed, cancelled, terminated] = results.map(
    (r) => r.data ?? 0
  );

  return {
    total,
    draft,
    active,
    overdue,
    completed,
    cancelled,
    terminated,
    terminatedGroup: cancelled + terminated,
    isLoading: results.some((r) => r.isLoading),
  };
};

export const useContractDetail = (id: string | null | undefined) =>
  useQuery({
    queryKey: [CONTRACT_DETAIL_KEY, id],
    queryFn: () => fetchContractById(id!),
    enabled: Boolean(id),
  });

export const useFacilityStaffs = (query?: FacilityStaffQuery, enabled = true) =>
  useQuery({
    queryKey: [FACILITY_STAFFS_KEY, query],
    queryFn: () => fetchFacilityStaffs(query),
    enabled,
    staleTime: 60_000,
  });

export const useContractPayments = (contractId: string | null | undefined) =>
  useQuery({
    queryKey: [CONTRACT_PAYMENTS_KEY, contractId],
    queryFn: () => fetchPaymentsByContract(contractId!),
    enabled: Boolean(contractId),
  });

export const useStorageUnitDetail = (storageUnitId: string | null | undefined) =>
  useQuery({
    queryKey: [STORAGE_UNIT_DETAIL_KEY, storageUnitId],
    queryFn: () => fetchStorageUnitById(storageUnitId!),
    enabled: Boolean(storageUnitId),
  });

function useInvalidateContractQueries() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [CONTRACTS_LIST_KEY] });
    queryClient.invalidateQueries({ queryKey: [CONTRACTS_STATS_KEY] });
    queryClient.invalidateQueries({ queryKey: [CONTRACT_DETAIL_KEY] });
    queryClient.invalidateQueries({ queryKey: [CONTRACT_PAYMENTS_KEY] });
    queryClient.invalidateQueries({ queryKey: [STORAGE_UNIT_DETAIL_KEY] });
    queryClient.invalidateQueries({ queryKey: ["manager-reservations"] });
    queryClient.invalidateQueries({ queryKey: ["manager-reservation-stats"] });
    queryClient.invalidateQueries({ queryKey: ["manager-reservation-detail"] });
    queryClient.invalidateQueries({ queryKey: ["available-storage-units"] });
    queryClient.invalidateQueries({ queryKey: ["storage-units"] });
    queryClient.invalidateQueries({ queryKey: ["storage-unit-stats"] });
    queryClient.invalidateQueries({ queryKey: ["facility-amenity-offerings"] });
  };
}

export const useCreateContract = () => {
  const invalidateAll = useInvalidateContractQueries();
  return useMutation({
    mutationFn: (payload: CreateContractRequest) => createContract(payload),
    onSuccess: invalidateAll,
  });
};

export const useCheckInContract = () => {
  const invalidateAll = useInvalidateContractQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CheckInContractRequest }) =>
      checkInContract(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useCancelContract = () => {
  const invalidateAll = useInvalidateContractQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelContractRequest }) =>
      cancelContract(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useRenewContract = () => {
  const invalidateAll = useInvalidateContractQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RenewContractRequest }) =>
      renewContract(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useCreateContractAddendum = () => {
  const invalidateAll = useInvalidateContractQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateContractAddendumRequest }) =>
      createContractAddendum(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useApproveContractAddendum = () => {
  const invalidateAll = useInvalidateContractQueries();
  return useMutation({
    mutationFn: ({
      id,
      addendumId,
      payload,
    }: {
      id: string;
      addendumId: string;
      payload: ApproveContractAddendumRequest;
    }) => approveContractAddendum(id, addendumId, payload),
    onSuccess: invalidateAll,
  });
};

export const useRejectContractAddendum = () => {
  const invalidateAll = useInvalidateContractQueries();
  return useMutation({
    mutationFn: ({
      id,
      addendumId,
      payload,
    }: {
      id: string;
      addendumId: string;
      payload: RejectContractAddendumRequest;
    }) => rejectContractAddendum(id, addendumId, payload),
    onSuccess: invalidateAll,
  });
};

export const useStaffSignContractAddendum = () => {
  const invalidateAll = useInvalidateContractQueries();
  return useMutation({
    mutationFn: ({
      id,
      addendumId,
      payload,
    }: {
      id: string;
      addendumId: string;
      payload: SignContractAddendumRequest;
    }) => staffSignContractAddendum(id, addendumId, payload),
    onSuccess: invalidateAll,
  });
};

export const useCancelContractAddendum = () => {
  const invalidateAll = useInvalidateContractQueries();
  return useMutation({
    mutationFn: ({
      id,
      addendumId,
      payload,
    }: {
      id: string;
      addendumId: string;
      payload: CancelContractAddendumRequest;
    }) => cancelContractAddendum(id, addendumId, payload),
    onSuccess: invalidateAll,
  });
};

export const useCheckOutContract = () => {
  const invalidateAll = useInvalidateContractQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CheckOutContractRequest }) =>
      checkOutContract(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useTerminateContract = () => {
  const invalidateAll = useInvalidateContractQueries();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TerminateContractRequest }) =>
      terminateContract(id, payload),
    onSuccess: invalidateAll,
  });
};

export const useCreateContractDepositPayment = () => {
  const invalidateAll = useInvalidateContractQueries();
  return useMutation({
    mutationFn: ({
      contractId,
      method,
      purpose = PaymentPurposeEnum.CONTRACT_DEPOSIT,
    }: {
      contractId: string;
      method?: PaymentMethodEnum;
      purpose?: PaymentPurposeEnum;
    }) => createContractDepositPayment(contractId, method, purpose),
    onSuccess: invalidateAll,
  });
};

export const useConfirmManualContractPayment = () => {
  const invalidateAll = useInvalidateContractQueries();
  return useMutation({
    mutationFn: ({
      paymentId,
      payload,
    }: {
      paymentId: string;
      payload: ConfirmManualPaymentRequest;
    }) => confirmManualContractPayment(paymentId, payload),
    onSuccess: invalidateAll,
  });
};

export const useToggleStorageUnitMaintenance = () => {
  const invalidateAll = useInvalidateContractQueries();
  return useMutation({
    mutationFn: ({
      storageUnitId,
      payload,
    }: {
      storageUnitId: string;
      payload: ToggleMaintenanceRequest;
    }) => toggleStorageUnitMaintenance(storageUnitId, payload),
    onSuccess: invalidateAll,
  });
};
