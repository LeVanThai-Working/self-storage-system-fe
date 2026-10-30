export enum RackZoneEnum {
  PRIME = "PRIME",
  STANDARD = "STANDARD",
  ECONOMY = "ECONOMY",
}

export enum RackStatusEnum {
  AVAILABLE = "available",
  RESERVED = "reserved",
  RENTED = "rented",
  ACTIVE = "active", // Maintained for backward compatibility / Tương thích ngược
  MAINTENANCE = "maintenance",
  INACTIVE = "inactive",
}

export enum RackTierStatusEnum {
  AVAILABLE = "available",
  OCCUPIED = "occupied",
  MAINTENANCE = "maintenance",
  INACTIVE = "inactive",
}
