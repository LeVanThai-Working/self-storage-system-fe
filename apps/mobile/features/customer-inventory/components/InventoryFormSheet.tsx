import React from "react";
import { Pressable, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { BottomSheet } from "./BottomSheet";

interface InventoryFormSheetProps {
  visible: boolean;
  title: string;
  isPending: boolean;
  confirmDisabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}

/** Bottom sheet shared by the stock in / out / move / adjust forms. */
export function InventoryFormSheet({
  visible,
  title,
  isPending,
  confirmDisabled = false,
  onClose,
  onConfirm,
  children,
}: InventoryFormSheetProps) {
  const { t } = useTranslation();
  const disabled = isPending || confirmDisabled;

  return (
    <BottomSheet
      visible={visible}
      title={title}
      onClose={onClose}
      closeDisabled={isPending}
      footer={
        <>
          <Pressable
            onPress={onConfirm}
            disabled={disabled}
            className={`h-12 flex-row items-center justify-center rounded-xl shadow-sm active:opacity-90 ${
              disabled && !isPending ? "bg-neutral-300 dark:bg-neutral-700" : "bg-cta"
            }`}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-sm font-bold text-white">{t("rackMap.form.confirm")}</Text>
            )}
          </Pressable>
          <Pressable
            onPress={onClose}
            disabled={isPending}
            className="h-12 items-center justify-center rounded-xl bg-neutral-100 active:opacity-80 dark:bg-neutral-800"
          >
            <Text className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
              {t("rackMap.form.cancel")}
            </Text>
          </Pressable>
        </>
      }
    >
      {children}
    </BottomSheet>
  );
}

interface FieldLabelProps {
  children: React.ReactNode;
}

export function FieldLabel({ children }: FieldLabelProps) {
  return (
    <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-200">{children}</Text>
  );
}

interface FieldErrorProps {
  message?: string | null;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return <Text className="text-xs font-semibold text-red-600 dark:text-red-400">{message}</Text>;
}
