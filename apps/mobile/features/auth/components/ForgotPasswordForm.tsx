import React, { useRef, useState } from "react";
import { View, TextInput, Pressable, ActivityIndicator, Keyboard } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordRequest,
  type ResetPasswordRequest,
} from "@self-storage-system-fe/shared";
import { useRouter } from "expo-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Eye, EyeOff, Mail, Lock, KeyRound, AlertCircle, CheckCircle } from "lucide-react-native";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { useTranslation } from "@/stores/language.store";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();
  const {
    sendResetOtp,
    isSendingOtp,
    isOtpSent,
    resetPassword,
    isResettingPassword,
    errorMessage,
    successMessage,
  } = useForgotPassword();

  const otpInputRef = useRef<TextInput>(null);
  const newPasswordInputRef = useRef<TextInput>(null);

  // Form handling when OTP has been sent
  const resetForm = useForm<ResetPasswordRequest>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      newPassword: "",
    },
  });

  // Form handling for requesting OTP initially
  const initialForm = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleRequestOtp = (data: ForgotPasswordRequest) => {
    Keyboard.dismiss();
    sendResetOtp(data, {
      onSuccess: () => {
        resetForm.setValue("email", data.email);
      },
    });
  };

  const handleResetSubmit = (data: ResetPasswordRequest) => {
    Keyboard.dismiss();
    resetPassword(data);
  };

  return (
    <View className="w-full gap-4">
      {/* Error Notification */}
      {errorMessage && (
        <View className="flex-row items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5">
          <AlertCircle size={20} color="#EF4444" />
          <Text className="flex-1 text-xs font-medium leading-5 text-red-600">{errorMessage}</Text>
        </View>
      )}

      {/* Success Notification */}
      {successMessage && (
        <View className="flex-row items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
          <CheckCircle size={20} color="#10B981" />
          <Text className="flex-1 text-xs font-medium leading-5 text-emerald-700">
            {successMessage}
          </Text>
        </View>
      )}

      {!isOtpSent ? (
        // Step 1: Enter email to request OTP
        <View className="gap-4">
          <View className="gap-1.5">
            <Label required error={!!initialForm.formState.errors.email}>
              {t("auth.email")}
            </Label>
            <View className="relative justify-center">
              <Controller
                control={initialForm.control}
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
                    returnKeyType="done"
                    onSubmitEditing={initialForm.handleSubmit(handleRequestOtp)}
                    error={!!initialForm.formState.errors.email}
                    className="h-12 pl-10 pr-3 rounded-xl text-base"
                  />
                )}
              />
              <View className="pointer-events-none absolute left-3 top-3">
                <Mail size={18} color="#647B80" />
              </View>
            </View>
            {initialForm.formState.errors.email && (
              <Text variant="error" className="text-xs">
                {initialForm.formState.errors.email.message}
              </Text>
            )}
          </View>

          <Button
            variant="primary"
            size="lg"
            disabled={isSendingOtp}
            onPress={initialForm.handleSubmit(handleRequestOtp)}
            className="mt-2 h-12 w-full rounded-xl bg-brand active:opacity-90"
          >
            {isSendingOtp ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-base font-bold text-white">{t("auth.sendOtp")}</Text>
            )}
          </Button>
        </View>
      ) : (
        // Step 2: Enter OTP and New Password
        <View className="gap-4">
          {/* Registered Email */}
          <View className="gap-1.5">
            <Label required error={!!resetForm.formState.errors.email}>
              {t("auth.email")}
            </Label>
            <View className="relative justify-center">
              <Controller
                control={resetForm.control}
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
                    onSubmitEditing={() => otpInputRef.current?.focus()}
                    error={!!resetForm.formState.errors.email}
                    className="h-12 pl-10 pr-3 rounded-xl text-base"
                  />
                )}
              />
              <View className="pointer-events-none absolute left-3 top-3">
                <Mail size={18} color="#647B80" />
              </View>
            </View>
            {resetForm.formState.errors.email && (
              <Text variant="error" className="text-xs">
                {resetForm.formState.errors.email.message}
              </Text>
            )}
          </View>

          {/* OTP Code Input */}
          <View className="gap-1.5">
            <Label required error={!!resetForm.formState.errors.otp}>
              {t("auth.otp")}
            </Label>
            <View className="relative justify-center">
              <Controller
                control={resetForm.control}
                name="otp"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    ref={otpInputRef}
                    placeholder={t("auth.otpPlaceholder")}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="next"
                    onSubmitEditing={() => newPasswordInputRef.current?.focus()}
                    error={!!resetForm.formState.errors.otp}
                    className="h-12 pl-10 pr-3 rounded-xl text-base tracking-widest"
                  />
                )}
              />
              <View className="pointer-events-none absolute left-3 top-3">
                <KeyRound size={18} color="#647B80" />
              </View>
            </View>
            {resetForm.formState.errors.otp && (
              <Text variant="error" className="text-xs">
                {resetForm.formState.errors.otp.message}
              </Text>
            )}
          </View>

          {/* New Password Input */}
          <View className="gap-1.5">
            <Label required error={!!resetForm.formState.errors.newPassword}>
              {t("auth.newPassword")}
            </Label>
            <View className="relative justify-center">
              <Controller
                control={resetForm.control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    ref={newPasswordInputRef}
                    placeholder={t("auth.newPasswordPlaceholder")}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={resetForm.handleSubmit(handleResetSubmit)}
                    error={!!resetForm.formState.errors.newPassword}
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
            {resetForm.formState.errors.newPassword && (
              <Text variant="error" className="text-xs">
                {resetForm.formState.errors.newPassword.message}
              </Text>
            )}
          </View>

          {/* Submit Reset Button */}
          <Button
            variant="primary"
            size="lg"
            disabled={isResettingPassword}
            onPress={resetForm.handleSubmit(handleResetSubmit)}
            className="mt-2 h-12 w-full rounded-xl bg-brand active:opacity-90"
          >
            {isResettingPassword ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-base font-bold text-white">
                {t("auth.resetPasswordSubmit")}
              </Text>
            )}
          </Button>
        </View>
      )}

      {/* Back to Sign In Link */}
      <View className="mt-2 flex-row items-center justify-center">
        <Pressable onPress={() => router.replace("/(auth)/login" as any)} hitSlop={8}>
          <Text className="text-sm font-bold text-brand">{t("auth.backToLogin")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
