import React from "react";
import {
  Modal,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";

interface InventoryFormSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  isPending: boolean;
  confirmDisabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}

/** Bottom sheet shell shared by the stock in / out / move / adjust forms. */
export function InventoryFormSheet({
  visible,
  title,
  subtitle,
  isPending,
  confirmDisabled = false,
  onClose,
  onConfirm,
  children,
}: InventoryFormSheetProps) {
  const { t } = useTranslation();
  const disabled = isPending || confirmDisabled;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="max-h-[88%] rounded-t-3xl bg-white dark:bg-neutral-900 border-t border-neutral-border dark:border-neutral-800">
          <View className="flex-row items-center justify-between border-b border-neutral-border dark:border-neutral-800 px-5 py-4">
            <View className="flex-1 pr-3">
              <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
                {title}
              </Text>
              {subtitle ? (
                <Text variant="muted" className="text-xs mt-0.5">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              disabled={isPending}
              className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
            >
              <X size={16} color="#647B80" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerClassName="p-5 pb-8 gap-4"
            keyboardShouldPersistTaps="handled"
          >
            {children}

            <View className="flex-row gap-3 pt-1">
              <Pressable
                onPress={onClose}
                disabled={isPending}
                className="flex-1 items-center justify-center rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 py-3.5"
              >
                <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  {t("rackMap.form.cancel")}
                </Text>
              </Pressable>

              <Pressable
                onPress={onConfirm}
                disabled={disabled}
                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-3.5 shadow-sm active:opacity-90 ${
                  disabled && !isPending ? "bg-neutral-300 dark:bg-neutral-700" : "bg-cta"
                }`}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-xs font-bold text-white">{t("rackMap.form.confirm")}</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface FieldLabelProps {
  children: React.ReactNode;
}

export function FieldLabel({ children }: FieldLabelProps) {
  return (
    <Text className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
      {children}
    </Text>
  );
}

interface FieldErrorProps {
  message?: string | null;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <Text className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">{message}</Text>
  );
}
