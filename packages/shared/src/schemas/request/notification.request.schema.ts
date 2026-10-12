import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.schema";
import {
  NotificationChannelEnum,
  NotificationPriorityEnum,
  NotificationTypeEnum,
} from "../../enums/notification.enum";

export const notificationQuerySchema = paginationQuerySchema.extend({
  isRead: z
    .preprocess((val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
  type: z.nativeEnum(NotificationTypeEnum).optional(),
  priority: z.nativeEnum(NotificationPriorityEnum).optional(),
});

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;

export const notificationIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid notification ID format"),
});

export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;

export interface CreateNotificationInput {
  recipientId: string;
  title: string;
  content: string;
  type: NotificationTypeEnum;
  priority?: NotificationPriorityEnum;
  channels?: NotificationChannelEnum[];
  metadata?: Record<string, unknown>;
}

export const sendTestNotificationSchema = z.object({
  recipientId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid recipient ID format"),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  type: z.string().default("SYSTEM_ALERT"),
});

export type SendTestNotificationRequest = z.infer<typeof sendTestNotificationSchema>;
