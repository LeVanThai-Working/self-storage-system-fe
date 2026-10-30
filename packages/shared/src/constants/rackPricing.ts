import { RackZoneEnum } from "../enums/storageRack.enum";

/** Mirrors BE `DEFAULT_RACK_ZONE_PRICING` (src/config/pricing.config.ts), VND per month. */
export const DEFAULT_RACK_ZONE_PRICING: Record<RackZoneEnum, number> = {
  [RackZoneEnum.PRIME]: 1_500_000,
  [RackZoneEnum.STANDARD]: 1_200_000,
  [RackZoneEnum.ECONOMY]: 1_000_000,
};

/**
 * POST /reservations accepts `rentedRackIds` (BE G16). BE only checks the racks when the list is
 * non-empty, otherwise it holds the whole unit, so clients must require at least one rack.
 */
export const RESERVATION_RACK_SELECTION_SUPPORTED = true;
