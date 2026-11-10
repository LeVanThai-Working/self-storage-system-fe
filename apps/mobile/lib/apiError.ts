import type { MessageLocale } from "@self-storage-system-fe/shared";
import { resolveReservationErrorMessage } from "@/features/reservations/utils/reservationFormat";

/** Localized message (and BE message code) for a failed API call outside the reservation flow. */
export function resolveRequestError(
  error: unknown,
  locale: MessageLocale = "vi"
): { message: string; messageCode?: string } {
  return resolveReservationErrorMessage(error, locale, "request");
}
