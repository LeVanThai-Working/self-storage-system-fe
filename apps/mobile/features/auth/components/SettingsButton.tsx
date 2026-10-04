import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Settings, User } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { SettingsModal } from "./SettingsModal";
import { useTranslation } from "@/stores/language.store";
import { useAuthStore } from "../stores/auth.store";

export function SettingsButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : null;

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        className="mr-3 flex-row items-center gap-1.5 rounded-full border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-800 py-1 px-2.5 shadow-sm active:bg-neutral-100 dark:active:bg-neutral-700"
        accessibilityLabel={t("settings.title")}
        hitSlop={8}
      >
        <View className="h-6 w-6 items-center justify-center rounded-full bg-brand">
          {userInitial ? (
            <Text className="text-xs font-bold text-white leading-none">{userInitial}</Text>
          ) : (
            <User size={13} color="#FFFFFF" />
          )}
        </View>
        <Settings size={15} color="#647B80" />
      </Pressable>

      <SettingsModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
}
