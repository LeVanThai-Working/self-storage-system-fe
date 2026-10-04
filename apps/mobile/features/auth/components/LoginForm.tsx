import React, { useRef, useState } from "react";
import { View, TextInput, Pressable, ActivityIndicator, Keyboard } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginRequest } from "@self-storage-system-fe/shared";
import { useRouter } from "expo-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react-native";
import { useLogin } from "../hooks/useLogin";
import { useTranslation } from "@/stores/language.store";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);
  const { login, isLoading, errorMessage } = useLogin();
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginRequest) => {
    Keyboard.dismiss();
    login(data);
  };

  return (
    <View className="w-full gap-5">
      {/* API Error Notification */}
      {errorMessage && (
        <View className="flex-row items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5">
          <AlertCircle size={20} color="#EF4444" />
          <Text className="flex-1 text-xs font-medium leading-5 text-red-600">{errorMessage}</Text>
        </View>
      )}

      {/* Email Input Field */}
      <View className="gap-1.5">
        <Label required error={!!errors.email}>
          {t("auth.email")}
        </Label>
        <View className="relative justify-center">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder={t("auth.emailPlaceholder")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                error={!!errors.email}
                className="h-12 pl-10 pr-3 rounded-xl text-base"
              />
            )}
          />
          <View className="pointer-events-none absolute left-3 top-3">
            <Mail size={18} color="#647B80" />
          </View>
        </View>
        {errors.email && (
          <Text variant="error" className="text-xs">
            {errors.email.message}
          </Text>
        )}
      </View>

      {/* Password Input Field */}
      <View className="gap-1.5">
        <View className="flex-row items-center justify-between">
          <Label required error={!!errors.password}>
            {t("auth.password")}
          </Label>
          <Pressable onPress={() => router.push("/(auth)/forgot-password" as any)} hitSlop={8}>
            <Text className="text-xs font-semibold text-brand">{t("auth.forgotPassword")}</Text>
          </Pressable>
        </View>

        <View className="relative justify-center">
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                ref={passwordInputRef}
                placeholder={t("auth.passwordPlaceholder")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
                error={!!errors.password}
                className="h-12 pl-10 pr-12 rounded-xl text-base"
              />
            )}
          />
          <View className="pointer-events-none absolute left-3 top-3">
            <Lock size={18} color="#647B80" />
          </View>
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-3 p-1"
            hitSlop={10}
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff size={20} color="#647B80" />
            ) : (
              <Eye size={20} color="#647B80" />
            )}
          </Pressable>
        </View>
        {errors.password && (
          <Text variant="error" className="text-xs">
            {errors.password.message}
          </Text>
        )}
      </View>

      {/* Submit Button */}
      <Button
        variant="primary"
        size="lg"
        disabled={isLoading}
        onPress={handleSubmit(onSubmit)}
        className="mt-2 h-12 w-full rounded-xl bg-brand active:opacity-90"
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text className="text-base font-bold text-white">{t("auth.login")}</Text>
        )}
      </Button>

      {/* Sign Up Navigation Link */}
      <View className="mt-2 flex-row items-center justify-center gap-1.5">
        <Text variant="muted" className="text-sm">
          {t("auth.noAccount")}
        </Text>
        <Pressable onPress={() => router.push("/(auth)/register" as any)} hitSlop={8}>
          <Text className="text-sm font-bold text-brand">{t("auth.register")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
