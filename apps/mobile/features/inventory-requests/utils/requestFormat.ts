import {
  InventoryRequestStatusEnum,
  MESSAGE_CODE,
  type InventoryRequestItemResponse,
  type MessageLocale,
} from "@self-storage-system-fe/shared";
import type { StatusTone } from "@/components/ui/status-pill";
import { resolveReservationErrorMessage } from "@/features/reservations/utils/reservationFormat";

/** Badge colors from the mock style guide (C9 / S1). */
export const REQUEST_STATUS_TONE: Record<InventoryRequestStatusEnum, StatusTone> = {
  [InventoryRequestStatusEnum.PENDING]: "yellow",
  [InventoryRequestStatusEnum.PENDING_CUSTOMER_CONFIRMATION]: "orange",
  [InventoryRequestStatusEnum.PROCESSING]: "blue",
  [InventoryRequestStatusEnum.READY_TO_PUTAWAY]: "purple",
  [InventoryRequestStatusEnum.COMPLETED]: "green",
  [InventoryRequestStatusEnum.DISPUTED]: "red",
  [InventoryRequestStatusEnum.CANCELLED]: "gray",
  [InventoryRequestStatusEnum.EXPIRED]: "brown",
};

export const REQUEST_ERROR = {
  INVALID_CODE: MESSAGE_CODE.MESSAGE_CODE_631,
  INVALID_TRANSITION: MESSAGE_CODE.MESSAGE_CODE_632,
  CANNOT_CANCEL: MESSAGE_CODE.MESSAGE_CODE_634,
} as const;

export function sumRequestQuantity(items: InventoryRequestItemResponse[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** "A-03 · T03" for an item position, or null when the request item has no rack. */
export function formatItemPosition(item: InventoryRequestItemResponse): string | null {
  if (!item.rackCode) return null;
  return item.tierNumber
    ? `${item.rackCode} · T${String(item.tierNumber).padStart(2, "0")}`
    : item.rackCode;
}

/** Remaining time "23:41:08" until `expiresAt`, or null once expired. */
export function formatCountdown(expiresAt: string | null | undefined, now: number): string | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(totalSeconds / 3600))}:${pad(Math.floor((totalSeconds % 3600) / 60))}:${pad(totalSeconds % 60)}`;
}

export function resolveRequestError(
  error: unknown,
  locale: MessageLocale = "vi"
): { message: string; messageCode?: string } {
  return resolveReservationErrorMessage(error, locale, "inventory request");
}

/** Validity choices offered on new requests; BE accepts 1 hour to 7 days. */
export const REQUEST_VALIDITY_DAYS = [1, 3, 7] as const;
export type RequestValidityDays = (typeof REQUEST_VALIDITY_DAYS)[number];

/** ISO deadline `days` from now, kept a few minutes under BE's 7-day ceiling. */
export function validityToExpiresAt(days: RequestValidityDays, now = Date.now()): string {
  const SAFETY_MS = 5 * 60 * 1000;
  return new Date(now + days * 24 * 60 * 60 * 1000 - SAFETY_MS).toISOString();
}

/** A pre-advised inbound request waits at `pending` with an `INBOUND:` QR until goods arrive. */
export function isPreAdvisedInbound(request: { pickupQrPayload?: string | null }): boolean {
  return Boolean(request.pickupQrPayload?.startsWith("INBOUND:"));
}
