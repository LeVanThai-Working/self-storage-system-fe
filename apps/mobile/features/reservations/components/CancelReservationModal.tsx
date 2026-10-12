import React, { useState } from "react";
import {
  Modal,
  View,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useToast } from "@/stores/toast.store";
import { AlertTriangle, Info, CheckCircle2, X, XCircle } from "lucide-react-native";
import type { MessageLocale, ReservationResponse } from "@self-storage-system-fe/shared";
import { useCancelReservation } from "../hooks/useReservations";
import {
  getCancellationPolicyNotice,
  resolveReservationErrorMessage,
} from "../utils/reservationFormat";

interface CancelReservationModalProps {
  visible: boolean;
  onClose: () => void;
  reservation: ReservationResponse;
  locale?: MessageLocale;
  onCancelled: () => void;
}

export function CancelReservationModal({
  visible,
  onClose,
  reservation,
  locale = "vi",
  onCancelled,
}: CancelReservationModalProps) {
  const isEn = locale === "en";
  const toast = useToast();

  const cancelMutation = useCancelReservation(reservation.id);
  const [reason, setReason] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  const resetForm = () => {
    setReason("");
    setErrorText(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const policy = getCancellationPolicyNotice(reservation, locale);

  const quickReasons = isEn
    ? ["Changed storage schedule", "Want to switch facility or unit size", "No longer need storage"]
    : [
        "Thay đổi kế hoạch lưu trữ",
        "Muốn đổi sang cơ sở hoặc kích thước kho khác",
        "Không còn nhu cầu thuê kho",
      ];

  const handleConfirmCancel = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setErrorText(
        isEn
          ? "Cancellation reason must be at least 3 characters."
          : "Vui lòng nhập lý do hủy đơn (tối thiểu 3 ký tự)."
      );
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        cancellationReason: trimmed,
      });

      toast.success(
        isEn ? "Reservation cancelled successfully." : "Đã hủy đơn đặt chỗ thành công."
      );
      onCancelled();
      handleClose();
    } catch (error) {
      const resolved = resolveReservationErrorMessage(error, locale, "reservation");
      toast.error(resolved.message);
      onCancelled();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onShow={resetForm}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="max-h-[88%] rounded-t-3xl bg-white dark:bg-neutral-900 border-t border-neutral-border dark:border-neutral-800">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-neutral-border dark:border-neutral-800 px-5 py-4">
            <View>
              <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Cancel Reservation" : "Xác nhận hủy đơn đặt chỗ"}
              </Text>
              <Text variant="muted" className="text-xs mt-0.5">
                #{reservation.reservationCode}
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              disabled={cancelMutation.isPending}
              className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
            >
              <X size={16} color="#647B80" />
            </Pressable>
          </View>

          <ScrollView contentContainerClassName="p-5 pb-8 gap-4">
            {/* Refund Policy Notice Banner (Section 3.4 - Action 4) */}
            <View
              className={`rounded-2xl border p-4 ${
                policy.severity === "danger"
                  ? "border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40"
                  : policy.severity === "success"
                    ? "border-brand/50 bg-brand-light/40 dark:bg-brand/20"
                    : "border-sky-200 dark:border-sky-900 bg-sky-50/80 dark:bg-sky-950/30"
              }`}
            >
              <View className="flex-row items-center gap-2 mb-1.5">
                {policy.severity === "danger" ? (
                  <AlertTriangle size={18} color="#EF4444" />
                ) : policy.severity === "success" ? (
                  <CheckCircle2 size={18} color="#0B927E" />
                ) : (
                  <Info size={18} color="#0284C7" />
                )}
                <Text
                  className={`text-xs font-extrabold flex-1 ${
                    policy.severity === "danger"
                      ? "text-red-700 dark:text-red-300"
                      : policy.severity === "success"
                        ? "text-brand"
                        : "text-sky-800 dark:text-sky-300"
                  }`}
                >
                  {policy.title}
                </Text>
              </View>
              <Text className="text-xs text-neutral-700 dark:text-neutral-300 leading-4">
                {policy.description}
              </Text>
            </View>

            {/* Quick Reasons */}
            <View>
              <Text className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
                {isEn ? "Cancellation Reason (Required)" : "Lý do hủy đặt chỗ (Bắt buộc)"}
              </Text>

              <View className="flex-row flex-wrap gap-2 mb-2.5">
                {quickReasons.map((item) => {
                  const selected = reason === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => {
                        setReason(item);
                        setErrorText(null);
                      }}
                      className={`rounded-xl border px-3 py-1.5 ${
                        selected
                          ? "border-brand bg-brand-light/40 dark:bg-brand/20"
                          : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          selected ? "text-brand" : "text-neutral-600 dark:text-neutral-300"
                        }`}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                value={reason}
                onChangeText={(val) => {
                  setReason(val.slice(0, 500));
                  setErrorText(null);
                }}
                multiline
                numberOfLines={3}
                placeholder={
                  isEn
                    ? "Enter reason for cancelling (3 - 500 characters)..."
                    : "Nhập lý do hủy đặt chỗ (từ 3 đến 500 ký tự)..."
                }
                placeholderTextColor="#94A3B8"
                textAlignVertical="top"
                className="min-h-[84px] rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-3.5 text-xs text-neutral-dark dark:text-neutral-100"
              />

              <View className="mt-1 flex-row justify-between">
                {errorText ? (
                  <Text className="text-xs font-semibold text-red-600 dark:text-red-400 flex-1">
                    {errorText}
                  </Text>
                ) : (
                  <View />
                )}
                <Text variant="muted" className="text-[11px]">
                  {reason.trim().length}/500
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3 pt-1">
              <Pressable
                onPress={handleClose}
                disabled={cancelMutation.isPending}
                className="flex-1 items-center justify-center rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 py-3.5"
              >
                <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  {isEn ? "Keep Reservation" : "Giữ lại đơn"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmCancel}
                disabled={cancelMutation.isPending}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-red-600 py-3.5 shadow-sm active:opacity-90"
              >
                {cancelMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <XCircle size={16} color="#FFFFFF" />
                    <Text className="text-xs font-bold text-white">
                      {isEn ? "Confirm Cancel" : "Xác nhận hủy"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
