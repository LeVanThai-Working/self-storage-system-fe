import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotificationsApi,
  fetchUnreadCountApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  type NotificationQuery,
} from "../api/notification.api";
import { useAuthStore } from "@/features/auth/stores/auth.store";

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (query?: NotificationQuery) => [...notificationKeys.lists(), query] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export const useNotifications = (query?: NotificationQuery, enabled = true) => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: () => fetchNotificationsApi(query),
    enabled: isAuthenticated && enabled,
    staleTime: 1000 * 30, // 30s
  });
};

/**
 * Infinite query for smooth "lướt tới đâu load tới đó" on notifications list.
 */
export const useInfiniteNotifications = (limit = 15, enabled = true) => {
  const { isAuthenticated } = useAuthStore();
  return useInfiniteQuery({
    queryKey: [...notificationKeys.all, "infinite"],
    queryFn: ({ pageParam = 1 }) => fetchNotificationsApi({ page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.hasNextPage) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    enabled: isAuthenticated && enabled,
    staleTime: 1000 * 30,
  });
};

export const useUnreadCount = (enabled = true) => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: fetchUnreadCountApi,
    enabled: isAuthenticated && enabled,
    refetchInterval: isAuthenticated ? 1000 * 45 : false, // Poll every 45s if authenticated
    staleTime: 1000 * 20,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationAsReadApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsAsReadApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};
