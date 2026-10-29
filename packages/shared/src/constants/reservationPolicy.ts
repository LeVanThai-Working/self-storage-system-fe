/** Hours before check-in during which a cancellation still refunds 100% of the deposit. */
export const FREE_CANCEL_HOURS = 24;

/** Furthest check-in date a customer can book, in days from today (BE answers 313 beyond it). */
export const MAX_ADVANCE_DAYS = 30;

/** Minutes a reservation holds the unit before it expires unpaid. */
export const HOLD_MINUTES = 15;

const VN_OFFSET = "+07:00";

/**
 * Check-in moment the cancellation policy counts from, same rule as BE `getCheckInTargetTimeVN`
 * in `slot_start` mode: the start of the slot name ("08:00-10:00" → 08:00, Vietnam time), or the
 * start of the day when the slot name holds no time.
 */
export function getCheckInTargetTime(checkInDateKey: string, slotName?: string | null): Date {
  const rawStart = (slotName ?? "").split("-")[0]?.trim() ?? "";
  const time = /^([01]\d|2[0-3]):[0-5]\d$/.test(rawStart) ? rawStart : "00:00";
  return new Date(`${checkInDateKey}T${time}:00.000${VN_OFFSET}`);
}

/**
 * True when booking this check-in already falls inside the no-refund window, i.e. BE will flag
 * `immediateForfeitWarning` and cancelling after paying forfeits the whole deposit.
 */
export function isInsideForfeitWindow(
  checkInDateKey: string,
  slotName?: string | null,
  now: number = Date.now()
): boolean {
  const deadline =
    getCheckInTargetTime(checkInDateKey, slotName).getTime() - FREE_CANCEL_HOURS * 3600 * 1000;
  return now > deadline;
}
