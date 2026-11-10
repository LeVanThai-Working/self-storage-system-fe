export const CUSTOMER_INVENTORY_ENDPOINTS = {
  LIST: "/customer-inventories",
  IN: "/customer-inventories/in",
  OUT: "/customer-inventories/out",
  MOVE: "/customer-inventories/move",
  ADJUST: "/customer-inventories/adjust",
  MOVEMENTS: "/customer-inventories/movements",
  SUMMARY: "/customer-inventories/summary",
  SKU_LOCATOR: "/customer-inventories/sku-locator",
  TREE: (storageUnitId: string) => `/customer-inventories/unit/${storageUnitId}/tree`,
  SKU_LOCATIONS: (skuId: string) => `/customer-inventories/sku/${skuId}/locations`,
  BARCODE_LOCATIONS: (barcode: string) =>
    `/customer-inventories/barcode/${encodeURIComponent(barcode)}/locations`,
  DETAIL: (id: string) => `/customer-inventories/${id}`,
  STATUS: (id: string) => `/customer-inventories/${id}/status`,
} as const;
