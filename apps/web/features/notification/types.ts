import type {
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
