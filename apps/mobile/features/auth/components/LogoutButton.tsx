import React from "react";
import { Pressable, ActivityIndicator } from "react-native";
import { LogOut } from "lucide-react-native";
import { useLogout } from "../hooks/useLogout";
import { useTranslation } from "@/stores/language.store";

export function LogoutButton() {
  const { confirmLogout, isLoggingOut } = useLogout();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={confirmLogout}
      disabled={isLoggingOut}
      className="mr-3 flex-row items-center gap-1.5 rounded-lg border border-neutral-border bg-white px-2.5 py-1.5 shadow-sm active:bg-neutral-100"
      accessibilityLabel={t("auth.logout")}
      hitSlop={8}
    >
      {isLoggingOut ? (
        <ActivityIndicator size="small" color="#EF4444" />
      ) : (
        <LogOut size={16} color="#EF4444" />
      )}
    </Pressable>
  );
}
