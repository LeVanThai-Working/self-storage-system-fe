export const TASK_STATUS_BADGE_CONFIG = {
  PENDING: {
    label: "Chờ tiếp nhận",
    badgeColor: "#F59E0B",
  },
  ASSIGNED: {
    label: "Đã phân công",
    badgeColor: "#3B82F6",
  },
  PROCESSING: {
    label: "Đang xử lý",
    badgeColor: "#8B5CF6",
  },
  READY_TO_PUTAWAY: {
    label: "Chờ xếp lên kệ",
    badgeColor: "#10B981",
  },
  PENDING_CUSTOMER_CONFIRMATION: {
    label: "Chờ khách xác nhận",
    badgeColor: "#F97316",
  },
  COMPLETED: {
    label: "Đã hoàn tất",
    badgeColor: "#22C55E",
  },
  DISPUTED: {
    label: "Khiếu nại",
    badgeColor: "#EF4444",
  },
  CANCELLED: {
    label: "Đã hủy",
    badgeColor: "#6B7280",
  },
  EXPIRED: {
    label: "Đã hết hạn",
    badgeColor: "#78716C",
  },
} as const;

export type TaskStatusBadgeKey = keyof typeof TASK_STATUS_BADGE_CONFIG;

export const TASK_DISPATCH_ENDPOINTS = {
  // Customer Inventories
  CUSTOMER_INVENTORY_ASSIGN: (id: string) => `/api/v1/customer-inventories/requests/${id}/assign`,
  CUSTOMER_INVENTORY_INBOUND_CREATE: "/api/v1/customer-inventories/inbound-requests",
  CUSTOMER_INVENTORY_INBOUND_CONFIRM: (id: string) =>
    `/api/v1/customer-inventories/inbound-requests/${id}/confirm`,
  CUSTOMER_INVENTORY_VERIFY_INBOUND: "/api/v1/customer-inventories/inbound/verify",
  CUSTOMER_INVENTORY_VERIFY_OUTBOUND: "/api/v1/customer-inventories/outbound/verify",
  CUSTOMER_INVENTORY_PUTAWAY: (id: string) =>
    `/api/v1/customer-inventories/inbound-requests/${id}/putaway`,
  CUSTOMER_INVENTORY_OUTBOUND_COMPLETE: (id: string) =>
    `/api/v1/customer-inventories/outbound-requests/${id}/complete`,

  // Support Tickets
  SUPPORT_TICKET_PROCESS: (id: string) => `/api/v1/support-tickets/${id}/process`,
  SUPPORT_TICKET_COMPLETE: (id: string) => `/api/v1/support-tickets/${id}/complete`,

  // Incidents
  INCIDENT_ASSIGN: (id: string) => `/api/v1/incidents/${id}/assign`,
} as const;
