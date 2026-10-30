import { CustomerReservationStatus, type CustomerReservation } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The BE refuses check-in dates further out than this. */
export const MAX_CHECK_IN_DAYS_AHEAD = 30;

/** Cancelling at least this long before check-in refunds the deposit in full (BE policy). */
const FULL_REFUND_WINDOW_MS = DAY_MS;

export const STATUS_STYLES: Record<string, string> = {
  [CustomerReservationStatus.PENDING_PAYMENT]: "bg-amber-50 text-amber-700 border-amber-200/80",
  [CustomerReservationStatus.PAYMENT_SUCCESSFUL]: "bg-sky-50 text-sky-700 border-sky-200/80",
  [CustomerReservationStatus.CONFIRMED]: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  [CustomerReservationStatus.OVERDUE]: "bg-orange-50 text-orange-700 border-orange-200/80",
  [CustomerReservationStatus.COMPLETED]: "bg-teal-50 text-teal-700 border-teal-200/80",
  [CustomerReservationStatus.CANCELLED]: "bg-rose-50 text-rose-700 border-rose-200/80",
  [CustomerReservationStatus.EXPIRED]: "bg-slate-100 text-slate-600 border-slate-200",
};

/** Statuses from which the customer may still cancel (BE rule; a live contract blocks it server-side). */
const CANCELLABLE: string[] = [
  CustomerReservationStatus.PENDING_PAYMENT,
  CustomerReservationStatus.PAYMENT_SUCCESSFUL,
  CustomerReservationStatus.CONFIRMED,
  CustomerReservationStatus.OVERDUE,
];

export const isCancellable = (r: CustomerReservation) => CANCELLABLE.includes(r.status);

/** The deposit can still be paid: unpaid and inside the 15-minute hold. */
export const isAwaitingDeposit = (r: CustomerReservation) =>
  r.status === CustomerReservationStatus.PENDING_PAYMENT &&
  (!r.expiresAt || new Date(r.expiresAt).getTime() > Date.now());

export type CancelOutcome = "free" | "refund" | "forfeit";

/** What cancelling now does to the deposit — mirrors the BE policy so the dialog can warn up front. */
export function cancelOutcome(r: CustomerReservation, now = Date.now()): CancelOutcome {
  if (r.status === CustomerReservationStatus.PENDING_PAYMENT) return "free";
  if (r.status === CustomerReservationStatus.OVERDUE) return "forfeit";
  return new Date(r.checkInDate).getTime() - now >= FULL_REFUND_WINDOW_MS ? "refund" : "forfeit";
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date as YYYY-MM-DD, offset by `days`. Feeds <input type="date"> bounds. */
export function localDateString(daysFromToday = 0): string {
  const d = new Date(Date.now() + daysFromToday * DAY_MS);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** YYYY-MM-DD → ISO instant at midnight Vietnam time (the BE compares dates in UTC+7). */
export const toVietnamIso = (date: string) => new Date(`${date}T00:00:00+07:00`).toISOString();

/** Deposit the BE will ask for: price of one billing unit × deposit multiplier. */
export const depositFor = (pricePerUnit: number, depositMultiplier: number) =>
  pricePerUnit * depositMultiplier;

/** Seconds left until `iso`, never negative. */
export const secondsUntil = (iso: string, now = Date.now()) =>
  Math.max(0, Math.floor((new Date(iso).getTime() - now) / 1000));

export const formatCountdown = (seconds: number) =>
  `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
