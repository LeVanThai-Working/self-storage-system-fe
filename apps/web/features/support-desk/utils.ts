import {
  SupportTicketCategoryEnum,
  SupportTicketPriorityEnum,
  SupportTicketStatusEnum,
  type TicketContractRef,
  type TicketFacilityRef,
  type TicketUserRef,
} from "@self-storage-system-fe/shared";

/** BE may return a populated ref or just the id string. */
export const refName = (ref?: TicketUserRef | string | null) =>
  ref && typeof ref === "object" ? ref.name : undefined;

export const refPhone = (ref?: TicketUserRef | string | null) =>
  ref && typeof ref === "object" ? ref.phoneNumber : undefined;

export const refId = (ref?: { id: string } | string | null) =>
  ref ? (typeof ref === "string" ? ref : ref.id) : undefined;

export const contractCode = (ref?: TicketContractRef | string | null) =>
  ref && typeof ref === "object" ? ref.contractCode : undefined;

export const facilityName = (ref?: TicketFacilityRef | string | null) =>
  ref && typeof ref === "object" ? ref.name : undefined;

/** Title prefix the mobile app wrote on move tickets before BE added the category (G10). */
const LEGACY_MOVE_PREFIX = "[Chuyển vị trí]";

export const isMoveRequestTicket = (ticket: { category: string; title: string }) =>
  ticket.category === SupportTicketCategoryEnum.INVENTORY_MOVE_REQUEST ||
  ticket.title.startsWith(LEGACY_MOVE_PREFIX);

export const TICKET_STATUS_STYLE: Record<SupportTicketStatusEnum, string> = {
  [SupportTicketStatusEnum.PENDING]: "bg-amber-50 text-amber-700 border-amber-200/80",
  [SupportTicketStatusEnum.PROCESSING]: "bg-sky-50 text-sky-700 border-sky-200/80",
  [SupportTicketStatusEnum.COMPLETED]: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  [SupportTicketStatusEnum.CANCELLED]: "bg-slate-100 text-slate-600 border-slate-200",
};

export const TICKET_PRIORITY_STYLE: Record<SupportTicketPriorityEnum, string> = {
  [SupportTicketPriorityEnum.LOW]: "bg-slate-100 text-slate-600 border-slate-200",
  [SupportTicketPriorityEnum.MEDIUM]: "bg-teal-50 text-teal-700 border-teal-200/80",
  [SupportTicketPriorityEnum.HIGH]: "bg-orange-50 text-orange-700 border-orange-200/80",
  [SupportTicketPriorityEnum.URGENT]: "bg-rose-50 text-rose-700 border-rose-200/80",
};

export const formatDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
