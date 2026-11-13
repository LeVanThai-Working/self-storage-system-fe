import React, { useMemo } from "react";
import {
  Modal,
  View,
  FlatList,
  Pressable,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import {
  X,
  Bell,
  CheckCheck,
  CreditCard,
  FileText,
  CalendarClock,
  Warehouse,
  AlertCircle,
  Clock,
} from "lucide-react-native";
import {
  NotificationTypeEnum,
  getAccessScheduleNotificationId,
} from "@self-storage-system-fe/shared";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { accessScheduleKeys } from "@/features/access-schedules/hooks/useAccessSchedules";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import {
  useInfiniteNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from "../hooks/useNotifications";
import type { NotificationResponse } from "../api/notification.api";

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

function getNotificationIcon(type: NotificationTypeEnum) {
  switch (type) {
    case NotificationTypeEnum.PAYMENT:
      return <CreditCard size={18} color="#0B927E" />;
    case NotificationTypeEnum.CONTRACT:
      return <FileText size={18} color="#0B927E" />;
    case NotificationTypeEnum.RESERVATION:
    case NotificationTypeEnum.ACCESS_SCHEDULE:
      return <CalendarClock size={18} color="#FF702E" />;
    case NotificationTypeEnum.STORAGE_UNIT:
      return <Warehouse size={18} color="#0B927E" />;
    case NotificationTypeEnum.SYSTEM_ALERT:
      return <AlertCircle size={18} color="#EF4444" />;
    default:
      return <Bell size={18} color="#0B927E" />;
  }
}

function formatNotificationTime(dateString?: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function NotificationModal({ visible, onClose }: NotificationModalProps) {
  const router = useRouter();
  const client = useQueryClient();
  const { t } = useTranslation();
  const {
    data: infiniteData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteNotifications(15, visible);

  const { data: unreadCount = 0 } = useUnreadCount(visible);
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const notifications = useMemo(() => {
    return infiniteData?.pages.flatMap((page) => page.items) ?? [];
  }, [infiniteData]);

  const handleItemPress = (item: NotificationResponse) => {
    if (!item.isRead) {
      markAsReadMutation.mutate(item.id);
    }
    const scheduleId = getAccessScheduleNotificationId(item);
    if (scheduleId) {
      void client.invalidateQueries({ queryKey: accessScheduleKeys.detail(scheduleId) });
      onClose();
      router.push({ pathname: "/access-schedules/[id]", params: { id: scheduleId } });
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0 && !markAllAsReadMutation.isPending) {
      markAllAsReadMutation.mutate();
    }
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/60 px-3 pb-6 pt-16">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View className="w-full max-h-[85%] rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden">
              {/* Header */}
              <View className="flex-row items-center justify-between border-b border-neutral-border dark:border-neutral-800 px-5 py-4">
                <View className="flex-row items-center gap-2.5">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-light dark:bg-brand/20">
                    <Bell size={18} color="#0B927E" />
                  </View>
                  <View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
                        {t("notifications.title")}
                      </Text>
                      {unreadCount > 0 && (
                        <View className="rounded-full bg-cta px-2 py-0.5">
                          <Text className="text-[10px] font-bold text-white">{unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center gap-2">
                  {unreadCount > 0 && (
                    <Pressable
                      onPress={handleMarkAllRead}
                      disabled={markAllAsReadMutation.isPending}
                      hitSlop={8}
                      className="flex-row items-center gap-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1.5 active:opacity-70"
                    >
                      <CheckCheck size={14} color="#0B927E" />
                      <Text className="text-xs font-semibold text-brand">
                        {t("notifications.markAllRead")}
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={onClose}
                    hitSlop={8}
                    className="rounded-full p-1.5 active:bg-neutral-100 dark:active:bg-neutral-800"
                  >
                    <X size={20} color="#647B80" />
                  </Pressable>
                </View>
              </View>

              {/* Body: FlatList with infinite scroll (lướt tới đâu tải tới đó) */}
              {isLoading ? (
                <View className="py-16 items-center justify-center gap-3">
                  <ActivityIndicator size="small" color="#0B927E" />
                  <Text variant="muted" className="text-xs">
                    {t("common.loading")}
                  </Text>
                </View>
              ) : notifications.length === 0 ? (
                <View className="py-16 items-center justify-center px-4">
                  <View className="h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 mb-3">
                    <Bell size={28} color="#647B80" />
                  </View>
                  <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-200 text-center">
                    {t("notifications.noNotifications")}
                  </Text>
                  <Text variant="muted" className="text-xs text-center mt-1 leading-5">
                    {t("notifications.noNotificationsDesc")}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={notifications}
                  keyExtractor={(item) => item.id}
                  className="max-h-[500px]"
                  contentContainerClassName="p-4 gap-2.5"
                  showsVerticalScrollIndicator={false}
                  onEndReached={handleEndReached}
                  onEndReachedThreshold={0.4}
                  renderItem={({ item }) => {
                    const isUnread = !item.isRead;
                    return (
                      <Pressable
                        onPress={() => handleItemPress(item)}
                        className={`flex-row items-start gap-3 rounded-2xl border p-3.5 transition-colors ${
                          isUnread
                            ? "border-brand/40 bg-brand-light/30 dark:bg-brand/10"
                            : "border-neutral-border/60 dark:border-neutral-800 bg-white dark:bg-neutral-800/50"
                        }`}
                      >
                        {/* Icon */}
                        <View
                          className={`h-9 w-9 items-center justify-center rounded-xl ${
                            isUnread
                              ? "bg-brand-light dark:bg-brand/20"
                              : "bg-neutral-100 dark:bg-neutral-800"
                          }`}
                        >
                          {getNotificationIcon(item.type)}
                        </View>

                        {/* Content */}
                        <View className="flex-1 justify-center gap-0.5">
                          <View className="flex-row items-center justify-between gap-2">
                            <Text
                              numberOfLines={1}
                              className={`flex-1 text-xs ${
                                isUnread
                                  ? "font-bold text-neutral-dark dark:text-neutral-100"
                                  : "font-medium text-neutral-main dark:text-neutral-300"
                              }`}
                            >
                              {item.title}
                            </Text>
                            {isUnread && <View className="h-2 w-2 rounded-full bg-cta" />}
                          </View>

                          <Text numberOfLines={2} variant="muted" className="text-xs leading-4">
                            {item.content}
                          </Text>

                          {item.createdAt && (
                            <View className="flex-row items-center gap-1 mt-1">
                              <Clock size={11} color="#8C9E9E" />
                              <Text className="text-[10px] text-neutral-muted dark:text-neutral-500">
                                {formatNotificationTime(item.createdAt)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  }}
                  ListFooterComponent={
                    isFetchingNextPage ? (
                      <View className="py-3 items-center justify-center">
                        <ActivityIndicator size="small" color="#0B927E" />
                      </View>
                    ) : null
                  }
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
