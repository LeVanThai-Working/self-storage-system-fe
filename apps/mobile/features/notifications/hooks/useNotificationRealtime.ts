import { useEffect } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { API_BASE_URL, getAccessScheduleNotificationId } from "@self-storage-system-fe/shared";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { getMeApi } from "@/features/auth/api/auth.api";
import { tokenStorage } from "@/lib/storage/tokenStorage";
import { accessScheduleKeys } from "@/features/access-schedules/hooks/useAccessSchedules";
import type { NotificationResponse } from "../api/notification.api";
import { notificationKeys } from "./useNotifications";

/** Foreground in-app notifications only; reconnect reads the current access token. */
export function useNotificationRealtime() {
  const userId = useAuthStore((state) =>
    state.isAuthenticated
      ? (state.user?.id ?? (typeof state.user?._id === "string" ? state.user._id : undefined))
      : undefined
  );
  const client = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    let active = true;
    let authRetried = false;
    const foreground = () =>
      AppState.currentState !== "background" && AppState.currentState !== "inactive";
    const socket = io(new URL(process.env.EXPO_PUBLIC_API_BASE_URL ?? API_BASE_URL).origin, {
      autoConnect: false,
      auth: (callback) => {
        void tokenStorage.getAccessToken().then((token) => {
          if (active) callback({ token });
        });
      },
    });
    const refresh = () => {
      void client.invalidateQueries({ queryKey: notificationKeys.all });
      void client.invalidateQueries({ queryKey: accessScheduleKeys.all });
    };
    socket.on("connect", () => {
      authRetried = false;
      refresh();
    });
    socket.on("notification:new", (notification: NotificationResponse) => {
      void client.invalidateQueries({ queryKey: notificationKeys.all });
      if (getAccessScheduleNotificationId(notification)) {
        // Notification text can describe an older assignment; reload the authoritative detail.
        void client.invalidateQueries({ queryKey: accessScheduleKeys.all });
      }
    });
    socket.on("notification:unread_count", (data: { unreadCount?: number }) => {
      if (
        typeof data?.unreadCount === "number" &&
        Number.isInteger(data.unreadCount) &&
        data.unreadCount >= 0
      ) {
        client.setQueryData(notificationKeys.unreadCount(), data.unreadCount);
      }
    });
    socket.on("connect_error", () => {
      if (!socket.active && !authRetried && foreground()) {
        authRetried = true;
        // The regular HTTP client refreshes an expired session; retry once, never loop.
        void getMeApi()
          .then(() => {
            if (active && foreground()) socket.connect();
          })
          .catch(() => {});
      }
    });
    if (foreground()) socket.connect();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        authRetried = false;
        refresh();
        socket.connect();
      } else socket.disconnect();
    });
    return () => {
      active = false;
      subscription.remove();
      socket.removeAllListeners();
      socket.disconnect();
      client.removeQueries({ queryKey: accessScheduleKeys.all });
      client.removeQueries({ queryKey: notificationKeys.all });
    };
  }, [userId, client]);
}
