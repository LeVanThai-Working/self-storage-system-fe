import { DEFAULT_RACK_ZONE_PRICING } from "../constants/rackPricing";
import { RackStatusEnum, RackZoneEnum } from "../enums/storageRack.enum";
import { StorageUnitStatusEnum } from "../enums/storageUnit.enum";
import type { StorageRackResponse } from "../types/storageRack.types";
import type { StorageUnitResponse } from "../types/storageUnit.types";

/* Seat-map helpers shared by the mobile and web booking flows (cinema-style unit / rack picker). */

export type ZonePricing = Partial<Record<RackZoneEnum, number>> | null | undefined;

export interface UnitZoneGroup {
  zone: string | null;
  units: StorageUnitResponse[];
}

export interface UnitFloorGroup {
  floor: number;
  zones: UnitZoneGroup[];
}

const naturalCompare = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

/** Floors ascending → zones A-Z (unzoned last) → unit numbers in natural order. */
export function groupUnitsByFloorAndZone(units: StorageUnitResponse[]): UnitFloorGroup[] {
  const floors = new Map<number, Map<string | null, StorageUnitResponse[]>>();
  units.forEach((unit) => {
    const zones = floors.get(unit.floor) ?? new Map<string | null, StorageUnitResponse[]>();
    const zone = unit.zone?.trim() || null;
    zones.set(zone, [...(zones.get(zone) ?? []), unit]);
    floors.set(unit.floor, zones);
  });
  return [...floors.entries()]
    .sort(([a], [b]) => a - b)
    .map(([floor, zones]) => ({
      floor,
      zones: [...zones.entries()]
        .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : naturalCompare(a, b)))
        .map(([zone, list]) => ({
          zone,
          units: [...list].sort((x, y) => naturalCompare(x.unitNumber, y.unitNumber)),
        })),
    }));
}

export function isUnitBookable(unit: StorageUnitResponse): boolean {
  return unit.status === StorageUnitStatusEnum.AVAILABLE;
}

/**
 * A rack can be picked when it is `available` and nobody holds it under a contract. BE reserves
 * `available` racks only, so the legacy `active` status is not bookable.
 */
export function isRackBookable(rack: StorageRackResponse): boolean {
  return rack.status === RackStatusEnum.AVAILABLE && !rack.currentContractId;
}

/**
 * Monthly price of one rack, same order as BE `createReservation`: custom price, then the offering
 * zone price, then `fallbackPrice` (the offering `pricePerUnit`). Without a fallback the shared
 * default zone price is used for display.
 */
export function getRackPrice(
  rack: StorageRackResponse,
  pricing: ZonePricing,
  fallbackPrice?: number | null
): number {
  if (typeof rack.customPrice === "number" && rack.customPrice >= 0) return rack.customPrice;
  const zone = rack.zone ?? RackZoneEnum.ECONOMY;
  const zonePrice = rack.zone ? pricing?.[rack.zone] : undefined;
  if (typeof zonePrice === "number") return zonePrice;
  return fallbackPrice ?? DEFAULT_RACK_ZONE_PRICING[zone];
}

export interface RackAisleGroup {
  aisle: string;
  zone: RackZoneEnum | null;
  racks: StorageRackResponse[];
}

/** Racks laid out like cinema rows: one row per aisle, seats ordered by bay. */
export function groupRacksByAisle(racks: StorageRackResponse[]): RackAisleGroup[] {
  const aisles = new Map<string, StorageRackResponse[]>();
  racks.forEach((rack) => {
    const aisle = rack.aisle?.trim().toUpperCase() || "—";
    aisles.set(aisle, [...(aisles.get(aisle) ?? []), rack]);
  });
  return [...aisles.entries()]
    .sort(([a], [b]) => naturalCompare(a, b))
    .map(([aisle, list]) => ({
      aisle,
      zone: list.find((rack) => rack.zone)?.zone ?? null,
      racks: [...list].sort(
        (a, b) => (a.bay ?? 0) - (b.bay ?? 0) || naturalCompare(a.rackCode, b.rackCode)
      ),
    }));
}

/** "1,5tr" style short price used on seat tiles. */
export function formatShortMillion(value: number): string {
  const millions = value / 1_000_000;
  return `${Number.isInteger(millions) ? millions : millions.toFixed(1).replace(".", ",")}tr`;
}
