import React from "react";
import { Modal, View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { X } from "lucide-react-native";
import { Text } from "@/components/ui/text";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Rendered next to the title (e.g. a status badge). */
  badge?: React.ReactNode;
  /** Blocks closing while a request is in flight. */
  closeDisabled?: boolean;
  /** Sticky area under the scrollable content (e.g. confirm / cancel buttons). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** Shared bottom sheet shell: dimmed backdrop (tap to close), drag handle, header and footer. */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  badge,
  closeDisabled = false,
  footer,
  children,
}: BottomSheetProps) {
  const handleClose = () => {
    if (!closeDisabled) onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable onPress={handleClose} className="absolute inset-0 bg-black/50" />

        <View className="max-h-[90%] rounded-t-3xl bg-white dark:bg-neutral-900">
          <View className="items-center pt-2.5">
            <View className="h-1.5 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          </View>

          <View className="flex-row items-start justify-between gap-3 px-5 pb-3 pt-3">
            <View className="flex-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
                  {title}
                </Text>
                {badge}
              </View>
              {subtitle ? (
                <Text variant="muted" className="mt-0.5 text-xs">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={handleClose}
              disabled={closeDisabled}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
            >
              <X size={16} color="#647B80" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerClassName="gap-4 px-5 pb-5"
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {footer ? (
            <View className="gap-2.5 border-t border-neutral-border px-5 pb-6 pt-3 dark:border-neutral-800">
              {footer}
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
