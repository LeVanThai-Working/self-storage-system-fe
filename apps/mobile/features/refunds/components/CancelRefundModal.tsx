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
import { AlertTriangle, X } from "lucide-react-native";
import { useCancelCustomerRefund } from "../hooks/useRefunds";
import { useTranslation } from "@/stores/language.store";
import type { RefundRequestResponse } from "@self-storage-system-fe/shared";

interface CancelRefundModalProps {
  visible: boolean;
  onClose: () => void;
  refund: RefundRequestResponse;
  onSuccess?: () => void;
}

export function CancelRefundModal({ visible, onClose, refund, onSuccess }: CancelRefundModalProps) {
  const { locale } = useTranslation();
  const isEn = locale === "en";
  const toast = useToast();

  const cancelMutation = useCancelCustomerRefund();
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

  const quickReasons = isEn
    ? [
        "Changed mind / Want to continue contract",
        "Entered wrong bank account details",
        "Submitted by mistake",
      ]
    : [
        "Đổi ý, tiếp tục sử dụng dịch vụ",
        "Điền sai thông tin tài khoản ngân hàng",
        "Tạo nhầm yêu cầu",
      ];

  const handleConfirmCancel = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setErrorText(
        isEn
          ? "Cancellation reason must be at least 3 characters."
          : "Vui lòng nhập lý do hủy (tối thiểu 3 ký tự)."
      );
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        id: refund.id,
        cancellationReason: trimmed,
      });

      toast.success(
        isEn
          ? `Refund request ${refund.refundCode} has been cancelled.`
          : `Đã hủy yêu cầu hoàn tiền ${refund.refundCode}.`
      );

      handleClose();
      onSuccess?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (isEn ? "Failed to cancel refund request." : "Không thể hủy yêu cầu hoàn tiền.");
      setErrorText(msg);
      toast.error(msg);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center items-center bg-black/60 px-4"
      >
        <View className="bg-card w-full max-w-md rounded-2xl overflow-hidden border border-border shadow-xl">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-border/80">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-destructive/10 items-center justify-center">
                <AlertTriangle size={18} color="#EF4444" />
              </View>
              <Text className="text-base font-bold text-foreground">
                {isEn ? "Cancel Refund Request" : "Hủy yêu cầu hoàn tiền"}
              </Text>
            </View>

            <Pressable onPress={handleClose} disabled={cancelMutation.isPending} hitSlop={8}>
              <X size={20} color="#647B80" />
            </Pressable>
          </View>

          <ScrollView className="p-4 max-h-[460px]">
            <Text className="text-xs text-muted-foreground mb-3">
              {isEn
                ? `You are about to cancel refund request ${refund.refundCode}. This action cannot be undone.`
                : `Bạn đang thực hiện hủy yêu cầu hoàn tiền ${refund.refundCode}. Thao tác này sẽ kết thúc yêu cầu và không thể hoàn tác.`}
            </Text>

            {/* Quick Reason Chips */}
            <Text className="text-xs font-semibold text-foreground mb-1.5">
              {isEn ? "Suggested reasons:" : "Lý do gợi ý:"}
            </Text>
            <View className="flex-row flex-wrap gap-1.5 mb-3">
              {quickReasons.map((item, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => {
                    setReason(item);
                    setErrorText(null);
                  }}
                  className={`px-3 py-1.5 rounded-full border text-xs ${
                    reason === item ? "bg-brand/10 border-brand" : "bg-muted/40 border-border"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      reason === item ? "text-brand font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Reason Text Input */}
            <Text className="text-xs font-semibold text-foreground mb-1">
              {isEn ? "Cancellation reason *" : "Lý do hủy yêu cầu *"}
            </Text>
            <TextInput
              multiline
              numberOfLines={3}
              value={reason}
              onChangeText={(text) => {
                setReason(text);
                if (errorText) setErrorText(null);
              }}
              placeholder={
                isEn
                  ? "Describe why you want to cancel (min 3 chars)..."
                  : "Mô tả lý do hủy yêu cầu (tối thiểu 3 ký tự)..."
              }
              placeholderTextColor="#94A3B8"
              className="border border-border rounded-xl p-3 text-sm text-foreground bg-background min-h-[80px] text-top"
              maxLength={500}
            />

            {errorText && <Text className="text-xs text-destructive mt-1.5">{errorText}</Text>}
          </ScrollView>

          {/* Actions */}
          <View className="flex-row p-4 border-t border-border/80 gap-3">
            <Pressable
              onPress={handleClose}
              disabled={cancelMutation.isPending}
              className="flex-1 py-3 rounded-xl border border-border items-center justify-center bg-muted/20"
            >
              <Text className="text-sm font-semibold text-muted-foreground">
                {isEn ? "Keep Request" : "Giữ lại"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirmCancel}
              disabled={cancelMutation.isPending || reason.trim().length < 3}
              className={`flex-1 py-3 rounded-xl items-center justify-center ${
                cancelMutation.isPending || reason.trim().length < 3
                  ? "bg-destructive/40"
                  : "bg-destructive active:bg-destructive/90"
              }`}
            >
              {cancelMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-sm font-bold text-white">
                  {isEn ? "Confirm Cancel" : "Xác nhận hủy"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
