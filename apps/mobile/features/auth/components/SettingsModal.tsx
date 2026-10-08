import React from "react";
import { Modal, View, Pressable, TouchableWithoutFeedback } from "react-native";
import { X, Globe, Sun, Moon, LogOut, User as UserIcon, Shield, Phone } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/stores/language.store";
import { useThemeStore } from "@/stores/theme.store";
import { useColorScheme } from "nativewind";
import { useAuthStore } from "../stores/auth.store";
import { useLogout } from "../hooks/useLogout";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { t, locale, setLocale } = useTranslation();
  const { setThemeMode } = useThemeStore();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { user } = useAuthStore();
  const { confirmLogout } = useLogout();

  const handleSetTheme = (mode: "light" | "dark") => {
    setThemeMode(mode);
    setColorScheme(mode);
  };

  const handleLogoutPress = () => {
    onClose();
    // Prompt confirmation dialog after modal dismisses
    setTimeout(() => {
      confirmLogout();
    }, 300);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/60 px-4 pb-8 pt-16">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View className="w-full max-w-lg rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-2xl">
              {/* Header */}
              <View className="flex-row items-center justify-between pb-4 border-b border-neutral-border dark:border-neutral-800">
                <Text variant="title" className="font-bold text-neutral-dark dark:text-neutral-100">
                  {t("settings.title")}
                </Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={8}
                  className="rounded-full p-1.5 active:bg-neutral-100 dark:active:bg-neutral-800"
                >
                  <X size={20} color="#647B80" />
                </Pressable>
              </View>

              {/* User Profile Card */}
              {user && (
                <View className="my-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 p-4 border border-neutral-border/60 dark:border-neutral-700/60">
                  <View className="flex-row items-center gap-3">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand">
                      <UserIcon size={24} color="#FFFFFF" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
                          {user.name}
                        </Text>
                        <Badge variant="outline" className="border-brand/40 bg-brand-light/30">
                          <Text className="text-xs font-semibold text-brand">
                            {t("settings.roleCustomer")}
                          </Text>
                        </Badge>
                      </View>
                      <Text variant="muted" className="text-xs mt-0.5">
                        {user.email}
                      </Text>
                      {user.phoneNumber && (
                        <View className="flex-row items-center gap-1 mt-1">
                          <Phone size={11} color="#647B80" />
                          <Text variant="muted" className="text-xs">
                            {user.phoneNumber}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Language Selection Section */}
              <View className="py-3 border-b border-neutral-border dark:border-neutral-800">
                <View className="flex-row items-center gap-2 mb-2.5">
                  <Globe size={16} color="#0B927E" />
                  <Text className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {t("settings.language")}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => setLocale("vi")}
                    className={`flex-1 items-center justify-center py-2.5 rounded-xl border ${
                      locale === "vi"
                        ? "border-brand bg-brand-light dark:bg-brand/20"
                        : "border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        locale === "vi" ? "text-brand" : "text-neutral-dark dark:text-neutral-300"
                      }`}
                    >
                      {t("settings.vietnamese")}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setLocale("en")}
                    className={`flex-1 items-center justify-center py-2.5 rounded-xl border ${
                      locale === "en"
                        ? "border-brand bg-brand-light dark:bg-brand/20"
                        : "border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        locale === "en" ? "text-brand" : "text-neutral-dark dark:text-neutral-300"
                      }`}
                    >
                      {t("settings.english")}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Theme Mode Section */}
              <View className="py-3 border-b border-neutral-border dark:border-neutral-800">
                <View className="flex-row items-center gap-2 mb-2.5">
                  {colorScheme === "dark" ? (
                    <Moon size={16} color="#FF702E" />
                  ) : (
                    <Sun size={16} color="#FF702E" />
                  )}
                  <Text className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {t("settings.appearance")}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleSetTheme("light")}
                    className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl border ${
                      colorScheme !== "dark"
                        ? "border-cta bg-cta-light dark:bg-cta/20"
                        : "border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                    }`}
                  >
                    <Sun size={16} color={colorScheme !== "dark" ? "#FF702E" : "#647B80"} />
                    <Text
                      className={`text-sm font-bold ${
                        colorScheme !== "dark"
                          ? "text-cta"
                          : "text-neutral-dark dark:text-neutral-300"
                      }`}
                    >
                      {t("settings.lightMode")}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleSetTheme("dark")}
                    className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl border ${
                      colorScheme === "dark"
                        ? "border-cta bg-cta-light dark:bg-cta/20"
                        : "border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                    }`}
                  >
                    <Moon size={16} color={colorScheme === "dark" ? "#FF702E" : "#647B80"} />
                    <Text
                      className={`text-sm font-bold ${
                        colorScheme === "dark"
                          ? "text-cta"
                          : "text-neutral-dark dark:text-neutral-300"
                      }`}
                    >
                      {t("settings.darkMode")}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Version & Sign Out Section */}
              <View className="pt-4">
                <Text variant="muted" className="text-center text-xs mb-3">
                  {t("settings.appVersion")}
                </Text>

                <Pressable
                  onPress={handleLogoutPress}
                  className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 py-3 active:opacity-80"
                >
                  <LogOut size={18} color="#EF4444" />
                  <Text className="text-sm font-bold text-red-600 dark:text-red-400">
                    {t("settings.signOut")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
