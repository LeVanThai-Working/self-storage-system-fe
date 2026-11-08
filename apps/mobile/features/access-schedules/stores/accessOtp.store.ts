import { create } from "zustand";

interface AccessOtpState {
  /** scheduleId → 6-digit OTP. BE returns it only once (booking response), so keep it in memory. */
  otpByScheduleId: Record<string, string>;
  remember: (scheduleId: string, otp: string) => void;
  forget: (scheduleId: string) => void;
}

/** In-memory only on purpose: the OTP opens the warehouse gate and must not be persisted on device. */
export const useAccessOtpStore = create<AccessOtpState>((set) => ({
  otpByScheduleId: {},
  remember: (scheduleId, otp) =>
    set((state) => ({ otpByScheduleId: { ...state.otpByScheduleId, [scheduleId]: otp } })),
  forget: (scheduleId) =>
    set((state) => {
      const next = { ...state.otpByScheduleId };
      delete next[scheduleId];
      return { otpByScheduleId: next };
    }),
}));
