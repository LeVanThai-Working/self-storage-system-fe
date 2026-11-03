import type { ContractResponse, StorageRackResponse } from "@self-storage-system-fe/shared";

/**
 * Determines whether a rack is rented by the customer under the given contract.
 */
export function isRackRentedByCustomer(
  rack: StorageRackResponse,
  contract?: Partial<ContractResponse> | null,
  customerId?: string | null,
  allRacks?: StorageRackResponse[]
): boolean {
  if (!rack) return false;

  // 1. BE explicit: rack.currentContractId matches the contract id
  if (
    contract?.id &&
    rack.currentContractId &&
    String(rack.currentContractId) === String(contract.id)
  ) {
    return true;
  }

  // 2. BE explicit: rack.currentCustomerId matches the customer id
  if (
    customerId &&
    rack.currentCustomerId &&
    String(rack.currentCustomerId) === String(customerId)
  ) {
    return true;
  }

  // 3. Customer isMine flag (if present from backend response)
  if (rack.isMine === true) {
    return true;
  }

  // 4. Contract rentedRackIds list
  if (contract && Array.isArray(contract.rentedRackIds) && contract.rentedRackIds.length > 0) {
    const ids = contract.rentedRackIds.map(String);
    if (ids.includes(String(rack.id)) || ids.includes(rack.rackCode)) {
      return true;
    }
  }

  // 5. Contract rentedRacks list
  if (contract && Array.isArray(contract.rentedRacks) && contract.rentedRacks.length > 0) {
    if (
      contract.rentedRacks.some(
        (r) => String(r.id) === String(rack.id) || r.rackCode === rack.rackCode
      )
    ) {
      return true;
    }
  }

  // 6. Check if any rack in the unit has explicit rental data matching this contract/customer
  const hasSpecificRentalsInUnit = Boolean(
    (contract?.rentedRackIds && contract.rentedRackIds.length > 0) ||
    (contract?.rentedRacks && contract.rentedRacks.length > 0) ||
    allRacks?.some(
      (r) =>
        (contract?.id &&
          r.currentContractId &&
          String(r.currentContractId) === String(contract.id)) ||
        (customerId && r.currentCustomerId && String(r.currentCustomerId) === String(customerId))
    )
  );

  // If specific rentals were identified in the unit, any non-matching rack is NOT rented by this customer.
  if (hasSpecificRentalsInUnit) {
    return false;
  }

  // 7. Whole storage unit rental (rentalTargetType === "storage_unit")
  if (contract?.rentalTargetType === "storage_unit") {
    return true;
  }

  return false;
}

/**
 * Filters the list of racks in the unit to only those rented by the customer under the active contract.
 */
export function filterCustomerRacks(
  racks: StorageRackResponse[] | undefined | null,
  contract?: Partial<ContractResponse> | null,
  customerId?: string | null
): StorageRackResponse[] {
  if (!racks || racks.length === 0) return [];
  const rented = racks.filter((rack) => isRackRentedByCustomer(rack, contract, customerId, racks));

  const hasSpecificRentalsInUnit = Boolean(
    (contract?.rentedRackIds && contract.rentedRackIds.length > 0) ||
    (contract?.rentedRacks && contract.rentedRacks.length > 0) ||
    racks.some(
      (r) =>
        (contract?.id &&
          r.currentContractId &&
          String(r.currentContractId) === String(contract.id)) ||
        (customerId && r.currentCustomerId && String(r.currentCustomerId) === String(customerId))
    )
  );

  // If the contract or room has specific rack assignments, return only the rented ones.
  if (hasSpecificRentalsInUnit) {
    return rented;
  }

  // Otherwise (e.g. whole storage unit lease where rentedRackIds is not set), return all usable racks.
  return rented.length > 0 ? rented : racks;
}
