import type {
  SupportTicketCategoryEnum,
  SupportTicketPriorityEnum,
  SupportTicketStatusEnum,
} from "../enums/supportTicket.enum";
import type { TicketContractRef, TicketFacilityRef, TicketUserRef } from "./incident.types";

export interface SupportTicketStaffResponse {
  responseMessage: string;
  attachments: string[];
  respondedBy: TicketUserRef | string;
  respondedAt: string;
}

export interface SupportTicketResponse {
  id: string;
  /** SUP-YYMMDD-0001 */
  ticketCode: string;
  customer: TicketUserRef | string;
  facility?: TicketFacilityRef | string | null;
  contract?: TicketContractRef | string | null;
  category: SupportTicketCategoryEnum;
  priority: SupportTicketPriorityEnum;
  title: string;
  description: string;
  attachments: string[];
  status: SupportTicketStatusEnum;
  assignedStaff?: TicketUserRef | string | null;
  staffResponse?: SupportTicketStaffResponse | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}
