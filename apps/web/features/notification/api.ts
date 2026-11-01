import api from "@/lib/api/axios";
import type { ApiResponse, PaginatedData } from "@self-storage-system-fe/shared";
import type { NotificationQuery, NotificationResponse, UnreadCountResponse } from "./types";

export const fetchNotifications = async (
  query?: NotificationQuery
): Promise<PaginatedData<NotificationResponse>> => {
  const { data } = await api.get<ApiResponse<PaginatedData<NotificationResponse>>>(
    "/notifications",
    {
      params: query,
    }
  );
  return (
    data.data ?? {
      items: [],
      pagination: {
        totalItems: 0,
        totalPages: 1,
        page: 1,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false,
      },
    }
  );
};

export const fetchUnreadCount = async (): Promise<number> => {
  const { data } = await api.get<ApiResponse<UnreadCountResponse>>("/notifications/unread-count");
  return data.data?.unreadCount ?? 0;
};

export const markNotificationAsRead = async (id: string): Promise<NotificationResponse> => {
  const { data } = await api.patch<ApiResponse<NotificationResponse>>(`/notifications/${id}/read`);
  return data.data;
};

export const markAllNotificationsAsRead = async (): Promise<{ modifiedCount: number }> => {
  const { data } =
    await api.patch<ApiResponse<{ modifiedCount: number }>>("/notifications/read-all");
  return data.data;
};
