import api from "@/lib/api/axios";
import type { ApiResponse, PaginatedData } from "@self-storage-system-fe/shared";
import {
  NotificationTypeEnum,
  NotificationPriorityEnum,
  NotificationChannelEnum,
} from "@self-storage-system-fe/shared";

export interface NotificationResponse {
  id: string;
  recipientId: string;
  facilityId?: string | null;
  title: string;
  content: string;
  type: NotificationTypeEnum;
  priority: NotificationPriorityEnum;
  channels: NotificationChannelEnum[];
  isRead: boolean;
  readAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationTypeEnum;
  priority?: NotificationPriorityEnum;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export const fetchNotificationsApi = async (
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
        limit: 15,
        hasNextPage: false,
        hasPrevPage: false,
      },
    }
  );
};

export const fetchUnreadCountApi = async (): Promise<number> => {
  const { data } = await api.get<ApiResponse<UnreadCountResponse>>("/notifications/unread-count");
  return data.data?.unreadCount ?? 0;
};

export const markNotificationAsReadApi = async (id: string): Promise<NotificationResponse> => {
  const { data } = await api.patch<ApiResponse<NotificationResponse>>(`/notifications/${id}/read`);
  return data.data;
};

export const markAllNotificationsAsReadApi = async (): Promise<{ modifiedCount: number }> => {
  const { data } =
    await api.patch<ApiResponse<{ modifiedCount: number }>>("/notifications/read-all");
  return data.data;
};
