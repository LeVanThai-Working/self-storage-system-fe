import { create } from "zustand";

interface PickupOtpState {
  /** requestId → 6-digit OTP. BE returns it only once (create response), so keep it in memory. */
  otpByRequestId: Record<string, string>;
  remember: (requestId: string, otp: string) => void;
  forget: (requestId: string) => void;
}

/** In-memory only on purpose: the OTP is a pickup secret and must not be persisted on device. */
export const usePickupOtpStore = create<PickupOtpState>((set) => ({
  otpByRequestId: {},
  remember: (requestId, otp) =>
    set((state) => ({ otpByRequestId: { ...state.otpByRequestId, [requestId]: otp } })),
  forget: (requestId) =>
    set((state) => {
      const next = { ...state.otpByRequestId };
      delete next[requestId];
      return { otpByRequestId: next };
    }),
}));
