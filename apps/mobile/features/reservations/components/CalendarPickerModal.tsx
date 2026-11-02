import React, { useState, useMemo } from "react";
import { View, Modal, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Info } from "lucide-react-native";
import type { MessageLocale } from "@self-storage-system-fe/shared";
import { getTodayDateInput } from "../utils/reservationFormat";

interface CalendarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
  selectedDate?: string | null;
  minDate?: string;
  maxDate?: string;
  note?: string;
  locale?: MessageLocale;
}

const MONTH_NAMES_VI = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

const MONTH_NAMES_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS_VI = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const WEEKDAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarPickerModal({
  visible,
  onClose,
  onSelectDate,
  selectedDate,
  minDate = getTodayDateInput(0),
  maxDate,
  note,
  locale = "vi",
}: CalendarPickerModalProps) {
  const isEn = locale === "en";
  const todayStr = getTodayDateInput(0);

  // Initialize view year & month from selectedDate or minDate
  const initialDateObj = useMemo(() => {
    const raw = selectedDate || minDate || todayStr;
    const parts = raw.split("-").map(Number);
    if (parts.length === 3 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
      return { year: parts[0], month: parts[1] - 1 };
    }
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [selectedDate, minDate, todayStr]);

  const [prevVisible, setPrevVisible] = useState(visible);
  const [prevDateKey, setPrevDateKey] = useState(selectedDate || minDate || "");
  const [viewYear, setViewYear] = useState<number>(initialDateObj.year);
  const [viewMonth, setViewMonth] = useState<number>(initialDateObj.month);

  const currentDateKey = selectedDate || minDate || "";
  if (visible !== prevVisible || (visible && currentDateKey !== prevDateKey)) {
    setPrevVisible(visible);
    setPrevDateKey(currentDateKey);
    if (visible) {
      setViewYear(initialDateObj.year);
      setViewMonth(initialDateObj.month);
    }
  }

  const monthNames = isEn ? MONTH_NAMES_EN : MONTH_NAMES_VI;
  const weekdays = isEn ? WEEKDAYS_EN : WEEKDAYS_VI;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Check if we can go to previous month (don't navigate before minDate month)
  const canGoPrev = useMemo(() => {
    if (!minDate) return true;
    const [minY, minM] = minDate.split("-").map(Number);
    const minMonthIndex = minY * 12 + (minM - 1);
    const currentMonthIndex = viewYear * 12 + viewMonth;
    return currentMonthIndex > minMonthIndex;
  }, [minDate, viewYear, viewMonth]);

  // Check if we can go to next month (don't navigate way past maxDate month)
  const canGoNext = useMemo(() => {
    if (!maxDate) return true;
    const [maxY, maxM] = maxDate.split("-").map(Number);
    const maxMonthIndex = maxY * 12 + (maxM - 1);
    const currentMonthIndex = viewYear * 12 + viewMonth;
    return currentMonthIndex < maxMonthIndex;
  }, [maxDate, viewYear, viewMonth]);

  // Days in month & weekday offset (Monday = 0 ... Sunday = 6)
  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const startDayOfWeek = useMemo(() => {
    const raw = new Date(viewYear, viewMonth, 1).getDay();
    return raw === 0 ? 6 : raw - 1;
  }, [viewYear, viewMonth]);

  const calendarDays = useMemo(() => {
    const cells: ({
      dayNumber: number;
      dateStr: string;
      isDisabled: boolean;
      isSelected: boolean;
      isToday: boolean;
    } | null)[] = [];

    // Empty lead cells
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(null);
    }

    const pad = (n: number) => String(n).padStart(2, "0");

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
      const isDisabled =
        (Boolean(minDate) && dateStr < minDate) ||
        (Boolean(maxDate) && dateStr > (maxDate as string));
      const isSelected = selectedDate === dateStr;
      const isToday = todayStr === dateStr;

      cells.push({
        dayNumber: d,
        dateStr,
        isDisabled,
        isSelected,
        isToday,
      });
    }

    return cells;
  }, [viewYear, viewMonth, daysInMonth, startDayOfWeek, minDate, maxDate, selectedDate, todayStr]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 px-4 py-8">
        <View className="w-full max-w-sm rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <View className="flex-row items-center gap-2">
              <CalendarIcon size={18} color="#0B927E" />
              <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Select Move-in Date" : "Chọn ngày nhận kho"}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 active:opacity-70"
            >
              <X size={16} color="#647B80" />
            </Pressable>
          </View>

          {/* Month & Year Navigator */}
          <View className="flex-row items-center justify-between py-3">
            <Pressable
              onPress={handlePrevMonth}
              disabled={!canGoPrev}
              className={`h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 ${
                !canGoPrev ? "opacity-30" : "active:opacity-70"
              }`}
            >
              <ChevronLeft size={16} color="#0F172A" />
            </Pressable>

            <Text className="text-sm font-extrabold text-neutral-dark dark:text-neutral-100">
              {monthNames[viewMonth]} {viewYear}
            </Text>

            <Pressable
              onPress={handleNextMonth}
              disabled={!canGoNext}
              className={`h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 ${
                !canGoNext ? "opacity-30" : "active:opacity-70"
              }`}
            >
              <ChevronRight size={16} color="#0F172A" />
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View className="flex-row items-center justify-between mb-1.5 px-0.5">
            {weekdays.map((wd, idx) => (
              <View key={wd} className="flex-1 items-center py-1">
                <Text
                  className={`text-[11px] font-bold ${
                    idx >= 5 ? "text-brand" : "text-neutral-400 dark:text-neutral-500"
                  }`}
                >
                  {wd}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="flex-row flex-wrap">
            {calendarDays.map((cell, index) => {
              if (!cell) {
                return (
                  <View
                    key={`empty-${index}`}
                    style={{ width: "14.28%" }}
                    className="h-10 items-center justify-center p-0.5"
                  />
                );
              }

              const { dayNumber, dateStr, isDisabled, isSelected, isToday } = cell;

              return (
                <View
                  key={dateStr}
                  style={{ width: "14.28%" }}
                  className="h-10 items-center justify-center p-0.5"
                >
                  <Pressable
                    disabled={isDisabled}
                    onPress={() => {
                      onSelectDate(dateStr);
                      onClose();
                    }}
                    className={`h-9 w-9 items-center justify-center rounded-xl ${
                      isSelected
                        ? "bg-brand shadow-sm"
                        : isToday
                          ? "border border-brand bg-brand-light/20 dark:bg-brand/10"
                          : isDisabled
                            ? "bg-transparent opacity-25"
                            : "bg-transparent active:bg-neutral-100 dark:active:bg-neutral-800"
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        isSelected
                          ? "font-extrabold text-white"
                          : isToday
                            ? "font-bold text-brand"
                            : isDisabled
                              ? "text-neutral-400 dark:text-neutral-600 line-through"
                              : "font-semibold text-neutral-dark dark:text-neutral-100"
                      }`}
                    >
                      {dayNumber}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* Rule Note / Guidance */}
          {note ? (
            <View className="mt-3.5 flex-row items-start gap-2 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 p-2.5">
              <Info size={14} color="#D97706" style={{ marginTop: 1 }} />
              <Text className="text-[11px] leading-4 text-amber-800 dark:text-amber-300 flex-1">
                {note}
              </Text>
            </View>
          ) : null}

          {/* Footer Close Button */}
          <View className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <Pressable
              onPress={onClose}
              className="w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 py-2.5 items-center active:opacity-80"
            >
              <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                {isEn ? "Close" : "Đóng"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
