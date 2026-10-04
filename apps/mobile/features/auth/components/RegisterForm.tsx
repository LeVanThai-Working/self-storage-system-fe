import React, { useRef, useState } from "react";
import { View, TextInput, Pressable, ActivityIndicator, Keyboard } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterRequest } from "@self-storage-system-fe/shared";
import { useRouter } from "expo-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  KeyRound,
  AlertCircle,
  CheckCircle,
} from "lucide-react-native";
import { useRegister } from "../hooks/useRegister";
import { useTranslation } from "@/stores/language.store";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();
  const {
    sendOtp,
    isSendingOtp,
    isOtpSent,
    register,
    isRegistering,
    errorMessage,
    successMessage,
  } = useRegister();

  const otpInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      otp: "",
      name: "",
      password: "",
      phoneNumber: "",
    },
  });

  const handleSendOtp = () => {
    const email = getValues("email");
    if (!email) {
      return;
    }
    Keyboard.dismiss();
    sendOtp(email);
  };

  const onSubmit = (data: RegisterRequest) => {
    Keyboard.dismiss();
    register({
      ...data,
      phoneNumber: data.phoneNumber ? data.phoneNumber : undefined,
    });
  };

  return (
    <View className="w-full gap-4">
      {/* Error Banner */}
      {errorMessage && (
        <View className="flex-row items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5">
          <AlertCircle size={20} color="#EF4444" />
          <Text className="flex-1 text-xs font-medium leading-5 text-red-600">{errorMessage}</Text>
        </View>
      )}

      {/* Success Banner */}
      {successMessage && (
        <View className="flex-row items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
          <CheckCircle size={20} color="#10B981" />
          <Text className="flex-1 text-xs font-medium leading-5 text-emerald-700">
            {successMessage}
          </Text>
        </View>
      )}

      {/* Email Field with Send OTP Button */}
      <View className="gap-1.5">
        <Label required error={!!errors.email}>
          {t("auth.email")}
        </Label>
        <View className="flex-row items-center gap-2">
          <View className="relative flex-1 justify-center">
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
                  onSubmitEditing={handleSendOtp}
                  error={!!errors.email}
                  className="h-12 pl-10 pr-3 rounded-xl text-base"
                />
              )}
            />
            <View className="pointer-events-none absolute left-3 top-3">
              <Mail size={18} color="#647B80" />
            </View>
          </View>

          <Button
            variant="outline"
            disabled={isSendingOtp}
            onPress={handleSendOtp}
            className="h-12 px-4 rounded-xl border-brand bg-brand-light active:opacity-80"
          >
            {isSendingOtp ? (
              <ActivityIndicator color="#0B927E" size="small" />
            ) : (
              <Text className="text-xs font-bold text-brand">
                {isOtpSent ? t("auth.resendOtp") : t("auth.sendOtp")}
              </Text>
            )}
          </Button>
        </View>
        {errors.email && (
          <Text variant="error" className="text-xs">
            {errors.email.message}
          </Text>
        )}
      </View>

      {/* OTP Field */}
      <View className="gap-1.5">
        <Label required error={!!errors.otp}>
          {t("auth.otp")}
        </Label>
        <View className="relative justify-center">
          <Controller
            control={control}
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
                onSubmitEditing={() => nameInputRef.current?.focus()}
                error={!!errors.otp}
                className="h-12 pl-10 pr-3 rounded-xl text-base tracking-widest"
              />
            )}
          />
          <View className="pointer-events-none absolute left-3 top-3">
            <KeyRound size={18} color="#647B80" />
          </View>
        </View>
        {errors.otp && (
          <Text variant="error" className="text-xs">
            {errors.otp.message}
          </Text>
        )}
      </View>

      {/* Full Name Field */}
      <View className="gap-1.5">
        <Label required error={!!errors.name}>
          {t("auth.fullName")}
        </Label>
        <View className="relative justify-center">
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                ref={nameInputRef}
                placeholder={t("auth.fullNamePlaceholder")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                error={!!errors.name}
                className="h-12 pl-10 pr-3 rounded-xl text-base"
              />
            )}
          />
          <View className="pointer-events-none absolute left-3 top-3">
            <User size={18} color="#647B80" />
          </View>
        </View>
        {errors.name && (
          <Text variant="error" className="text-xs">
            {errors.name.message}
          </Text>
        )}
      </View>

      {/* Password Field */}
      <View className="gap-1.5">
        <Label required error={!!errors.password}>
          {t("auth.password")}
        </Label>
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
                returnKeyType="next"
                onSubmitEditing={() => phoneInputRef.current?.focus()}
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

      {/* Optional Phone Number Field */}
      <View className="gap-1.5">
        <Label error={!!errors.phoneNumber}>{t("auth.phoneNumber")}</Label>
        <View className="relative justify-center">
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                ref={phoneInputRef}
                placeholder={t("auth.phoneNumberPlaceholder")}
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
                error={!!errors.phoneNumber}
                className="h-12 pl-10 pr-3 rounded-xl text-base"
              />
            )}
          />
          <View className="pointer-events-none absolute left-3 top-3">
            <Phone size={18} color="#647B80" />
          </View>
        </View>
        {errors.phoneNumber && (
          <Text variant="error" className="text-xs">
            {errors.phoneNumber.message}
          </Text>
        )}
      </View>

      {/* Submit Register Button */}
      <Button
        variant="primary"
        size="lg"
        disabled={isRegistering}
        onPress={handleSubmit(onSubmit)}
        className="mt-3 h-12 w-full rounded-xl bg-brand active:opacity-90"
      >
        {isRegistering ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text className="text-base font-bold text-white">{t("auth.register")}</Text>
        )}
      </Button>

      {/* Back to Sign In Link */}
      <View className="mt-2 flex-row items-center justify-center gap-1.5">
        <Text variant="muted" className="text-sm">
          {t("auth.hasAccount")}
        </Text>
        <Pressable onPress={() => router.replace("/(auth)/login" as any)} hitSlop={8}>
          <Text className="text-sm font-bold text-brand">{t("auth.signInNow")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
