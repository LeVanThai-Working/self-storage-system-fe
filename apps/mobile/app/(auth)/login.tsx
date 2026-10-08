import React from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { useTranslation } from "@/stores/language.store";
import { Globe } from "lucide-react-native";

export default function LoginScreen() {
  const { t, locale, toggleLocale } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Thanh Header phụ: Nút chuyển đổi ngôn ngữ Vi / En */}
        <View className="flex-row items-center justify-end px-6 pt-2">
          <Pressable
            onPress={toggleLocale}
            className="flex-row items-center gap-1.5 rounded-full border border-neutral-border bg-white px-3 py-1.5 shadow-sm active:bg-neutral-100"
            hitSlop={8}
          >
            <Globe size={16} color="#0B927E" />
            <Text className="text-xs font-bold text-neutral-dark">
              {locale === "vi" ? "Tiếng Việt (VI)" : "English (EN)"}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-6"
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              {/* Logo & Tiêu đề Chào mừng */}
              <View className="mb-6 items-center">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-brand shadow-sm">
                  <Text className="text-2xl font-extrabold text-white">SH</Text>
                </View>
                <Text variant="heading2" className="text-center font-bold text-neutral-dark">
                  {t("auth.loginTitle")}
                </Text>
                <Text variant="muted" className="mt-1 text-center text-sm">
                  {t("auth.loginSubtitle")}
                </Text>
              </View>

              {/* Khung Form Card */}
              <View className="rounded-2xl border border-neutral-border bg-white p-6 shadow-sm">
                <LoginForm />
              </View>

              {/* Footer ghi chú hệ thống */}
              <View className="mt-8 items-center">
                <Text variant="muted" className="text-center text-xs">
                  {t("auth.systemSubtitle")}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
