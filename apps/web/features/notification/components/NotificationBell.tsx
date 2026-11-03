"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  Bell,
  CheckCheck,
  Inbox,
  AlertCircle,
  Calendar,
  FileText,
  Receipt,
  Warehouse,
  FileCheck2,
  Loader2,
} from "lucide-react";
import { NotificationTypeEnum } from "@self-storage-system-fe/shared";
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from "../hooks";
import type { NotificationResponse } from "../types";

function formatTimeAgo(dateStr?: string, locale = "vi"): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return locale === "vi" ? "Vừa xong" : "Just now";
  }
  if (diffMin < 60) {
    return locale === "vi" ? `${diffMin} phút trước` : `${diffMin}m ago`;
  }
  if (diffHour < 24) {
    return locale === "vi" ? `${diffHour} giờ trước` : `${diffHour}h ago`;
  }
  if (diffDay < 7) {
    return locale === "vi" ? `${diffDay} ngày trước` : `${diffDay}d ago`;
  }
  return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getNotificationIcon(type: NotificationTypeEnum) {
  switch (type) {
    case NotificationTypeEnum.PAYMENT:
      return <Receipt className="w-4 h-4 text-emerald-600" />;
    case NotificationTypeEnum.CONTRACT:
      return <FileText className="w-4 h-4 text-indigo-600" />;
    case NotificationTypeEnum.RESERVATION:
      return <Calendar className="w-4 h-4 text-blue-600" />;
    case NotificationTypeEnum.STORAGE_UNIT:
      return <Warehouse className="w-4 h-4 text-amber-600" />;
    case NotificationTypeEnum.APPROVAL_REQUEST:
      return <FileCheck2 className="w-4 h-4 text-orange-600" />;
    case NotificationTypeEnum.SYSTEM_ALERT:
      return <AlertCircle className="w-4 h-4 text-rose-600" />;
    default:
      return <Bell className="w-4 h-4 text-teal-600" />;
  }
}

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notificationData, isLoading } = useNotifications({ page: 1, limit: 15 }, isOpen);

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const notifications = notificationData?.items ?? [];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (notif: NotificationResponse) => {
    if (!notif.isRead) {
      markAsReadMutation.mutate(notif.id);
    }
  };

  const handleMarkAll = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <div className={`relative ${className ?? ""}`} ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2.5 text-slate-500 hover:text-emerald-600 transition-colors rounded-full hover:bg-slate-50 cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center shadow-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-800">
                {locale === "vi" ? "Thông báo" : "Notifications"}
              </h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[11px] font-semibold">
                  {unreadCount} {locale === "vi" ? "mới" : "new"}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{locale === "vi" ? "Đọc tất cả" : "Mark all as read"}</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                <span>
                  {locale === "vi" ? "Đang tải thông báo..." : "Loading notifications..."}
                </span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium">
                  {locale === "vi" ? "Không có thông báo nào" : "No notifications yet"}
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                    !notif.isRead ? "bg-emerald-50/30" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p
                        className={`text-xs truncate ${
                          !notif.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700"
                        }`}
                      >
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {notif.content}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                      {formatTimeAgo(notif.createdAt, locale)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
