import {
  SupportTicketCategoryEnum,
  SupportTicketPriorityEnum,
  SupportTicketStatusEnum,
  type CreateSupportTicketRequest,
} from "@self-storage-system-fe/shared";
import type { StatusTone } from "@/components/ui/status-pill";

/**
 * Move requests use the `inventory_move_request` category (BE G10). BE has no structured move
 * payload yet, so the details stay in the title and body for staff to read. Older tickets were
 * `general_inquiry` with this title prefix, which is why detection also checks the prefix.
 */
export const MOVE_REQUEST_PREFIX = "[Chuyển vị trí]";

export const TICKET_STATUS_TONE: Record<SupportTicketStatusEnum, StatusTone> = {
  [SupportTicketStatusEnum.PENDING]: "yellow",
  [SupportTicketStatusEnum.PROCESSING]: "blue",
  [SupportTicketStatusEnum.COMPLETED]: "green",
  [SupportTicketStatusEnum.CANCELLED]: "gray",
};

export function isMoveRequestTicket(ticket: {
  category: SupportTicketCategoryEnum;
  title: string;
}): boolean {
  return (
    ticket.category === SupportTicketCategoryEnum.INVENTORY_MOVE_REQUEST ||
    ticket.title.startsWith(MOVE_REQUEST_PREFIX)
  );
}

export interface MoveRequestDraft {
  contractId: string;
  skuCode: string;
  skuName: string;
  fromLabel: string;
  toLabel: string;
  quantity: number;
  uom: string;
  reason?: string;
}

export function buildMoveRequestTicket(draft: MoveRequestDraft): CreateSupportTicketRequest {
  const lines = [
    `Mã hàng: ${draft.skuCode} – ${draft.skuName}`,
    `Từ vị trí: ${draft.fromLabel}`,
    `Muốn chuyển đến: ${draft.toLabel}`,
    `Số lượng: ${draft.quantity} ${draft.uom}`,
  ];
  if (draft.reason) lines.push(`Lý do: ${draft.reason}`);
  return {
    category: SupportTicketCategoryEnum.INVENTORY_MOVE_REQUEST,
    priority: SupportTicketPriorityEnum.MEDIUM,
    contractId: draft.contractId,
    title: `${MOVE_REQUEST_PREFIX} ${draft.skuCode} ${draft.fromLabel} → ${draft.toLabel}`.slice(
      0,
      200
    ),
    description: lines.join("\n"),
    attachments: [],
  };
}
