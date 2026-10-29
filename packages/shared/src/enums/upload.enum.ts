export enum CloudinaryFolderEnum {
  AMENITIES = "self-storage/amenities",
  FACILITIES = "self-storage/facilities",
  UNIT_TYPES = "self-storage/unit-types",
  AVATARS = "self-storage/avatars",
  CONTRACTS = "self-storage/contracts",
  GENERAL = "self-storage/general",
  /** Same path as BE `CloudinaryFolderEnum.SKU`. */
  CUSTOMER_SKUS = "self-storage/skus",
  // FE-only folders: BE accepts any path matching /^[\w\-/]+$/
  INVENTORY_REQUESTS = "self-storage/inventory-requests",
  INCIDENTS = "self-storage/incidents",
  SUPPORT_TICKETS = "self-storage/support-tickets",
}
