import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastPayload {
  id?: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastState {
  currentToast: ToastPayload | null;
  showToast: (payload: ToastPayload) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  currentToast: null,
  showToast: (payload) => {
    const id = payload.id ?? Date.now().toString();
    set({ currentToast: { ...payload, id } });
  },
  hideToast: () => {
    set({ currentToast: null });
  },
}));

/**
 * Imperative helper methods to trigger toasts globally from any hook or callback.
 */
export const toast = {
  show: (payload: ToastPayload) => {
    useToastStore.getState().showToast(payload);
  },
  success: (message: string, title?: string, duration?: number) => {
    useToastStore.getState().showToast({ type: "success", message, title, duration });
  },
  error: (message: string, title?: string, duration?: number) => {
    useToastStore.getState().showToast({ type: "error", message, title, duration });
  },
  info: (message: string, title?: string, duration?: number) => {
    useToastStore.getState().showToast({ type: "info", message, title, duration });
  },
  warning: (message: string, title?: string, duration?: number) => {
    useToastStore.getState().showToast({ type: "warning", message, title, duration });
  },
  hide: () => {
    useToastStore.getState().hideToast();
  },
};

/**
 * React hook returning the global toast controller.
 */
export const useToast = () => toast;
