/** Time rules of warehouse access schedules, mirrored from the backend config. */
export const ACCESS_SCHEDULE_CONFIG = {
  /** Gate check-in opens this many minutes before the slot starts. */
  EARLY_CHECKIN_MINUTES: 30,
  /** Gate check-in closes this many minutes after the slot starts; the schedule then becomes no-show. */
  GRACE_CHECKIN_MINUTES: 45,
  /** Customers can cancel only until this many hours before the slot starts. */
  MIN_CANCEL_LEAD_HOURS: 1,
  MIN_PEOPLE: 1,
  MAX_PEOPLE: 10,
} as const;

export const ACCESS_SCHEDULE_ENDPOINTS = {
  LIST: "/access-schedules",
  CREATE: "/access-schedules",
  AVAILABLE_SLOTS: "/access-schedules/available-slots",
  CHECK_IN: "/access-schedules/check-in",
  PROCESS_NO_SHOW: "/access-schedules/process-no-show",
  DETAIL: (id: string) => `/access-schedules/${id}`,
  CHECK_OUT: (id: string) => `/access-schedules/${id}/check-out`,
  CANCEL: (id: string) => `/access-schedules/${id}/cancel`,
} as const;
