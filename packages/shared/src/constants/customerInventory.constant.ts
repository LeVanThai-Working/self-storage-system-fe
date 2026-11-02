export const CUSTOMER_INVENTORY_ENDPOINTS = {
  // Requests List & Details
  REQUESTS: "/api/v1/customer-inventories/requests",
  REQUEST_DETAIL: (id: string) => `/api/v1/customer-inventories/requests/${id}`,

  // Inbound Requests
  INBOUND_PRE_ADVISED: "/api/v1/customer-inventories/inbound-requests/pre-advised",
  INBOUND_CANCEL: (id: string) => `/api/v1/customer-inventories/inbound-requests/${id}/cancel`,
  INBOUND_PUTAWAY: (id: string) => `/api/v1/customer-inventories/inbound-requests/${id}/putaway`,
  INBOUND_CONFIRM: (id: string) => `/api/v1/customer-inventories/inbound-requests/${id}/confirm`,
  INBOUND_DISPUTE: (id: string) => `/api/v1/customer-inventories/inbound-requests/${id}/dispute`,

  // Outbound Requests
  OUTBOUND_CREATE: "/api/v1/customer-inventories/outbound-requests",
  OUTBOUND_CANCEL: (id: string) => `/api/v1/customer-inventories/outbound-requests/${id}/cancel`,
  OUTBOUND_COMPLETE: (id: string) =>
    `/api/v1/customer-inventories/outbound-requests/${id}/complete`,

  // Verification & Assignment
  VERIFY_PICKUP_CODE: "/api/v1/customer-inventories/verify-pickup-code",
  ASSIGN_STAFF: (id: string) => `/api/v1/customer-inventories/requests/${id}/assign`,
} as const;
