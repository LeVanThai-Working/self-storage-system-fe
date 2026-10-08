import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../stores/auth.store";
import { useTranslation } from "@/stores/language.store";
import { toast } from "@/stores/toast.store";

export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { t } = useTranslation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast.info(t("auth.logoutConfirmTitle") || "Signed out");
      router.replace("/(auth)/login" as any);
    } catch (error) {
      console.error("Sign out process encountered an issue:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(t("auth.logoutConfirmTitle"), t("auth.logoutConfirmMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("auth.logout"),
        style: "destructive",
        onPress: performLogout,
      },
    ]);
  };

  return {
    logout: performLogout,
    confirmLogout,
    isLoggingOut,
  };
}
