import React, { useState, useEffect } from "react";
import { View, ScrollView, Pressable, TextInput, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  User,
  Phone,
  Mail,
  Camera,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  KeyRound,
  Calendar,
  MapPin,
  Check,
  Trash2,
  RefreshCw,
  UserCheck,
} from "lucide-react-native";
import { CloudinaryFolderEnum } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { DetailHeader } from "@/components/layout/DetailHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import {
  getMeApi,
  getMyProfileApi,
  updateUserApi,
  updateMyProfileApi,
  changePasswordApi,
} from "@/features/auth/api/auth.api";
import { uploadImageToCloudinary } from "@/lib/upload/cloudinary";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";

function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return "KH";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfileScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const toast = useToast();
  const { user, setAuth } = useAuthStore();

  // 1. Account Info (from users collection)
  const [name, setName] = useState(user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [isEmailVerified, setIsEmailVerified] = useState(Boolean((user as any)?.isEmailVerified));

  // 2. Personal Info (from profile collection)
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [gender, setGender] = useState<string>("other");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");

  // 3. ID Card / CCCD (from profile collection)
  const [idCardFrontPhotoUrl, setIdCardFrontPhotoUrl] = useState("");
  const [idCardBackPhotoUrl, setIdCardBackPhotoUrl] = useState("");
  const [idCardLast4, setIdCardLast4] = useState("");

  // Loading States
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);

  // 4. Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync fresh profile & user data on mount
  useEffect(() => {
    let isMounted = true;
    async function loadFresh() {
      try {
        const [meRes, profileRes] = await Promise.allSettled([getMeApi(), getMyProfileApi()]);
        if (!isMounted) return;

        let latestName = user?.name || "";
        let latestPhone = user?.phoneNumber || "";
        let latestAvatar = user?.avatarUrl || "";

        if (meRes.status === "fulfilled" && meRes.value) {
          latestName = meRes.value.name || latestName;
          latestPhone = meRes.value.phoneNumber || latestPhone;
          setName(latestName);
          setPhoneNumber(latestPhone);
          setIsEmailVerified(Boolean((meRes.value as any).isEmailVerified));
        }

        if (profileRes.status === "fulfilled" && profileRes.value) {
          const prof = profileRes.value;
          if (prof.avatarUrl) {
            latestAvatar = prof.avatarUrl;
            setAvatarUrl(latestAvatar);
          }
          if (prof.gender) {
            setGender(prof.gender);
          }
          if (prof.address) {
            setAddress(prof.address);
          }
          if (prof.dateOfBirth) {
            const rawDob = String(prof.dateOfBirth);
            const match = rawDob.match(/^(\d{4}-\d{2}-\d{2})/);
            setDateOfBirth(match ? match[1] : rawDob);
          }
          if (prof.idCardFrontPhotoUrl) {
            setIdCardFrontPhotoUrl(prof.idCardFrontPhotoUrl);
          }
          if (prof.idCardBackPhotoUrl) {
            setIdCardBackPhotoUrl(prof.idCardBackPhotoUrl);
          }
          if (prof.idCardLast4) {
            setIdCardLast4(prof.idCardLast4);
          }
        }

        const resolvedUser = meRes.status === "fulfilled" && meRes.value ? meRes.value : user;
        if (resolvedUser) {
          setAuth({
            ...resolvedUser,
            name: latestName,
            phoneNumber: latestPhone,
            avatarUrl: latestAvatar,
          });
        }
      } catch (err) {
        console.warn("Failed to load fresh profile:", err);
      }
    }

    loadFresh();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = getInitials(name || user?.name);
  const isIdCardVerified = Boolean(idCardFrontPhotoUrl && idCardBackPhotoUrl);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)" as any);
    }
  };

  // 1. Pick & Upload Avatar
  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        toast.warning(
          locale === "en"
            ? "Photo library permission is required to select an avatar"
            : "Vui lòng cấp quyền truy cập thư viện ảnh để đổi ảnh đại diện"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      setIsUploadingAvatar(true);

      const uploadedUrl = await uploadImageToCloudinary(
        {
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          base64: asset.base64,
        },
        CloudinaryFolderEnum.AVATARS
      );

      setAvatarUrl(uploadedUrl);

      // Auto update profile with new avatar URL in profile collection (/profile/me)
      const updatedProfile = await updateMyProfileApi({ avatarUrl: uploadedUrl });
      if (user) {
        setAuth({
          ...user,
          avatarUrl: updatedProfile.avatarUrl || uploadedUrl,
        });
      }

      toast.success(t("profile.avatarUploadSuccess"));
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(error?.message || t("profile.avatarUploadError"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 2. Upload CCCD Front Photo
  const handlePickIdFront = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        toast.warning(
          locale === "en"
            ? "Photo library permission is required to upload ID photo"
            : "Vui lòng cấp quyền truy cập thư viện ảnh để tải ảnh CCCD"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      setIsUploadingFront(true);

      const uploadedUrl = await uploadImageToCloudinary(
        {
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          base64: asset.base64,
        },
        CloudinaryFolderEnum.GENERAL
      );

      setIdCardFrontPhotoUrl(uploadedUrl);
      // Auto persist to profile
      await updateMyProfileApi({ idCardFrontPhotoUrl: uploadedUrl });
      toast.success(t("profile.uploadIdFrontSuccess"));
    } catch (error: any) {
      console.error("Front ID upload error:", error);
      toast.error(error?.message || t("profile.uploadIdError"));
    } finally {
      setIsUploadingFront(false);
    }
  };

  // 3. Upload CCCD Back Photo
  const handlePickIdBack = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        toast.warning(
          locale === "en"
            ? "Photo library permission is required to upload ID photo"
            : "Vui lòng cấp quyền truy cập thư viện ảnh để tải ảnh CCCD"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      setIsUploadingBack(true);

      const uploadedUrl = await uploadImageToCloudinary(
        {
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          base64: asset.base64,
        },
        CloudinaryFolderEnum.GENERAL
      );

      setIdCardBackPhotoUrl(uploadedUrl);
      // Auto persist to profile
      await updateMyProfileApi({ idCardBackPhotoUrl: uploadedUrl });
      toast.success(t("profile.uploadIdBackSuccess"));
    } catch (error: any) {
      console.error("Back ID upload error:", error);
      toast.error(error?.message || t("profile.uploadIdError"));
    } finally {
      setIsUploadingBack(false);
    }
  };

  // 4. Save All Profile Information (users + profile collections)
  const handleSaveProfile = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedAddress = address.trim();
    const trimmedDob = dateOfBirth.trim();

    if (!trimmedName) {
      toast.warning(
        locale === "en" ? "Full name cannot be empty" : "Họ và tên không được để trống"
      );
      return;
    }

    if (trimmedPhone) {
      const phoneRegex = /^0(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        toast.warning(
          locale === "en"
            ? "Invalid phone number format (e.g. 0912345678)"
            : "Số điện thoại không đúng định dạng (vd: 0912345678)"
        );
        return;
      }
    }

    let parsedDob: string | undefined = undefined;
    if (trimmedDob) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(trimmedDob)) {
        toast.warning(
          locale === "en"
            ? "Date of birth format must be YYYY-MM-DD"
            : "Ngày sinh phải theo định dạng YYYY-MM-DD (vd: 1995-10-25)"
        );
        return;
      }
      parsedDob = trimmedDob;
    }

    setIsUpdatingProfile(true);
    try {
      let userId = user?.id || (user as any)?._id;
      if (!userId) {
        try {
          const freshMe = await getMeApi();
          userId = freshMe?.id || (freshMe as any)?._id;
        } catch (meErr) {
          console.warn("Failed to fetch user id on profile update:", meErr);
        }
      }

      if (!userId) {
        throw new Error("Không tìm thấy mã người dùng để cập nhật");
      }

      // 1. Update user info (name, phoneNumber) in users collection
      const updatedUser = await updateUserApi(String(userId), {
        name: trimmedName,
        phoneNumber: trimmedPhone || undefined,
      });

      // 2. Update profile info (gender, dateOfBirth, address, idCards) in profile collection
      const updatedProfile = await updateMyProfileApi({
        address: trimmedAddress || undefined,
        dateOfBirth: parsedDob,
        gender: gender || undefined,
        idCardFrontPhotoUrl: idCardFrontPhotoUrl || undefined,
        idCardBackPhotoUrl: idCardBackPhotoUrl || undefined,
      });

      // 3. Synchronize Zustand auth state
      if (user) {
        setAuth({
          ...user,
          name: updatedUser.name || trimmedName,
          phoneNumber: updatedUser.phoneNumber || trimmedPhone,
          avatarUrl: updatedProfile.avatarUrl || avatarUrl,
        });
      }

      toast.success(t("profile.updateProfileSuccess"));
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Cập nhật hồ sơ thất bại";
      toast.error(msg);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // 5. Change Password
  const handleChangePassword = async () => {
    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmNewPassword.trim();

    if (!trimmedCurrent) {
      toast.warning(t("profile.currentPasswordRequired"));
      return;
    }

    if (trimmedNew.length < 8) {
      toast.warning(t("profile.newPasswordLength"));
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      toast.warning(t("profile.passwordMismatch"));
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePasswordApi({
        currentPassword: trimmedCurrent,
        newPassword: trimmedNew,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success(t("profile.changePasswordSuccess"));
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Đổi mật khẩu thất bại";
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {/* Top Header */}
      <DetailHeader title={t("profile.title")} onBack={handleBack} />

      <ScrollView
        contentContainerClassName="p-4 pb-14 gap-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section 1: Avatar & Identity Card */}
        <View className="items-center rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
          <View className="relative mb-3">
            <Avatar size="xl" className="h-24 w-24 border-2 border-brand/40 bg-brand-light">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={name || "Avatar"} />
              ) : (
                <AvatarFallback label={initials} size="xl" />
              )}
            </Avatar>

            <Pressable
              onPress={handlePickAvatar}
              disabled={isUploadingAvatar}
              hitSlop={8}
              className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-brand border-2 border-white dark:border-neutral-900 shadow-md active:opacity-90"
              accessibilityLabel="Change avatar"
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Camera size={14} color="#FFFFFF" />
              )}
            </Pressable>
          </View>

          <Text className="text-lg font-bold text-neutral-dark dark:text-neutral-100 text-center">
            {name || user?.name || "Khách hàng"}
          </Text>
          <Text variant="muted" className="text-xs text-center mt-0.5">
            {user?.email}
          </Text>

          <Pressable
            onPress={handlePickAvatar}
            disabled={isUploadingAvatar}
            className="mt-3 flex-row items-center gap-1.5 rounded-full border border-brand/30 bg-brand-light/40 dark:bg-brand/20 px-3.5 py-1.5 active:opacity-80"
          >
            {isUploadingAvatar ? (
              <ActivityIndicator size="small" color="#0B927E" />
            ) : (
              <Camera size={13} color="#0B927E" />
            )}
            <Text className="text-xs font-semibold text-brand">
              {isUploadingAvatar ? t("profile.updatingProfile") : t("profile.changeAvatar")}
            </Text>
          </Pressable>
        </View>

        {/* Section 2: Thông tin tài khoản */}
        <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm gap-4">
          <View className="flex-row items-center gap-2 border-b border-neutral-border/60 dark:border-neutral-800 pb-3">
            <User size={18} color="#0B927E" />
            <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
              {t("profile.accountInfo")}
            </Text>
          </View>

          {/* Full Name */}
          <View className="gap-1.5">
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
              {t("profile.fullName")}
            </Text>
            <View className="flex-row items-center rounded-2xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 px-3.5 py-2.5">
              <User size={16} color="#647B80" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t("profile.fullNamePlaceholder")}
                placeholderTextColor="#8C9E9E"
                className="ml-2.5 flex-1 py-0 text-xs text-neutral-dark dark:text-neutral-100"
              />
            </View>
          </View>

          {/* Phone Number */}
          <View className="gap-1.5">
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
              {t("profile.phoneNumber")}
            </Text>
            <View className="flex-row items-center rounded-2xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 px-3.5 py-2.5">
              <Phone size={16} color="#647B80" />
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholder={t("profile.phonePlaceholder")}
                placeholderTextColor="#8C9E9E"
                className="ml-2.5 flex-1 py-0 text-xs text-neutral-dark dark:text-neutral-100"
              />
            </View>
          </View>

          {/* Email with Verified Status Badge */}
          <View className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                {t("profile.email")}
              </Text>
              {isEmailVerified ? (
                <View className="flex-row items-center gap-1 shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5">
                  <CheckCircle2 size={11} color="#059669" />
                  <Text
                    numberOfLines={1}
                    className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300"
                  >
                    {t("profile.verified")}
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-1 shrink-0 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2 py-0.5">
                  <AlertTriangle size={11} color="#D97706" />
                  <Text
                    numberOfLines={1}
                    className="text-[10px] font-bold text-amber-700 dark:text-amber-300"
                  >
                    {t("profile.notVerified")}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center rounded-2xl border border-neutral-border/40 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-800/40 px-3.5 py-2.5 opacity-85">
              <Mail size={16} color="#647B80" />
              <TextInput
                value={user?.email || ""}
                editable={false}
                className="ml-2.5 flex-1 py-0 text-xs text-neutral-500 dark:text-neutral-400"
              />
            </View>
          </View>
        </View>

        {/* Section 3: Thông tin cá nhân */}
        <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm gap-4">
          <View className="flex-row items-center gap-2 border-b border-neutral-border/60 dark:border-neutral-800 pb-3">
            <UserCheck size={18} color="#0B927E" />
            <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
              {t("profile.personalInfo")}
            </Text>
          </View>

          {/* Gender Selector (Pills) */}
          <View className="gap-1.5">
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
              {t("profile.gender")}
            </Text>
            <View className="flex-row gap-2">
              {[
                { value: "male", label: t("profile.genderMale") },
                { value: "female", label: t("profile.genderFemale") },
                { value: "other", label: t("profile.genderOther") },
              ].map((item) => {
                const isSelected = gender === item.value;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setGender(item.value)}
                    hitSlop={4}
                    className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl border py-2.5 active:opacity-80 ${
                      isSelected
                        ? "border-brand bg-brand-light/60 dark:bg-brand/20"
                        : "border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60"
                    }`}
                  >
                    {isSelected && <Check size={13} color="#0B927E" />}
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? "text-brand" : "text-neutral-dark dark:text-neutral-200"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Date of Birth */}
          <View className="gap-1.5">
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
              {t("profile.dateOfBirth")}
            </Text>
            <View className="flex-row items-center rounded-2xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 px-3.5 py-2.5">
              <Calendar size={16} color="#647B80" />
              <TextInput
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder={t("profile.dateOfBirthPlaceholder")}
                placeholderTextColor="#8C9E9E"
                className="ml-2.5 flex-1 py-0 text-xs text-neutral-dark dark:text-neutral-100"
              />
            </View>
          </View>

          {/* Contact Address */}
          <View className="gap-1.5">
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
              {t("profile.address")}
            </Text>
            <View className="flex-row items-center rounded-2xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 px-3.5 py-2.5">
              <MapPin size={16} color="#647B80" />
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder={t("profile.addressPlaceholder")}
                placeholderTextColor="#8C9E9E"
                className="ml-2.5 flex-1 py-0 text-xs text-neutral-dark dark:text-neutral-100"
              />
            </View>
          </View>
        </View>

        {/* Section 4: Giấy tờ CCCD */}
        <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm gap-4">
          <View className="flex-row items-center justify-between border-b border-neutral-border/60 dark:border-neutral-800 pb-3">
            <View className="flex-row items-center gap-2">
              <ShieldCheck size={18} color="#0B927E" />
              <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {t("profile.idCardSection")}
              </Text>
            </View>

            {/* Verification Badge */}
            {isIdCardVerified ? (
              <View className="flex-row items-center gap-1 shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5">
                <CheckCircle2 size={12} color="#059669" />
                <Text
                  numberOfLines={1}
                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
                >
                  {t("profile.verified")}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1 shrink-0 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2.5 py-0.5">
                <AlertTriangle size={12} color="#D97706" />
                <Text
                  numberOfLines={1}
                  className="text-[11px] font-bold text-amber-700 dark:text-amber-300"
                >
                  {t("profile.notVerified")}
                </Text>
              </View>
            )}
          </View>

          {/* Verification Status Banner */}
          {isIdCardVerified ? (
            <View className="flex-row items-center gap-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3">
              <CheckCircle2 size={16} color="#059669" />
              <Text className="text-xs text-emerald-800 dark:text-emerald-200 flex-1">
                {t("profile.idCardVerifiedDesc")}
                {idCardLast4 ? ` (•••• ${idCardLast4})` : ""}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3">
              <AlertCircle size={16} color="#D97706" />
              <Text className="text-xs text-amber-800 dark:text-amber-200 flex-1">
                {t("profile.idCardNotVerifiedDesc")}
              </Text>
            </View>
          )}

          {/* Front & Back Photo Cards */}
          <View className="gap-3">
            {/* Front Photo Card */}
            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                  {t("profile.idCardFront")}
                </Text>
                {idCardFrontPhotoUrl ? (
                  <View className="flex-row items-center gap-1">
                    <CheckCircle2 size={11} color="#059669" />
                    <Text className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {t("profile.idCardUploaded")}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-[10px] font-medium text-neutral-400">
                    {t("profile.idCardNotUploaded")}
                  </Text>
                )}
              </View>

              {idCardFrontPhotoUrl ? (
                <View className="relative h-36 w-full rounded-2xl overflow-hidden border border-neutral-border dark:border-neutral-700 bg-neutral-900">
                  <Image
                    source={{ uri: idCardFrontPhotoUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                  <View className="absolute top-2.5 right-2.5 flex-row items-center gap-2">
                    <Pressable
                      onPress={handlePickIdFront}
                      disabled={isUploadingFront}
                      hitSlop={6}
                      className="flex-row items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 active:opacity-80"
                    >
                      {isUploadingFront ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <RefreshCw size={11} color="#FFFFFF" />
                      )}
                      <Text className="text-[11px] font-semibold text-white">
                        {t("profile.changePhoto")}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setIdCardFrontPhotoUrl("")}
                      hitSlop={6}
                      className="h-7 w-7 items-center justify-center rounded-full bg-black/70 active:opacity-80"
                      accessibilityLabel="Remove front photo"
                    >
                      <Trash2 size={12} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={handlePickIdFront}
                  disabled={isUploadingFront}
                  className="h-32 w-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 active:opacity-75"
                >
                  {isUploadingFront ? (
                    <View className="items-center gap-2">
                      <ActivityIndicator size="small" color="#0B927E" />
                      <Text variant="muted" className="text-xs">
                        {t("profile.updatingProfile")}
                      </Text>
                    </View>
                  ) : (
                    <View className="items-center gap-1.5">
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-light/70 dark:bg-brand/20">
                        <Camera size={18} color="#0B927E" />
                      </View>
                      <Text className="text-xs font-semibold text-brand">
                        {t("profile.uploadPhoto")}
                      </Text>
                    </View>
                  )}
                </Pressable>
              )}
            </View>

            {/* Back Photo Card */}
            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                  {t("profile.idCardBack")}
                </Text>
                {idCardBackPhotoUrl ? (
                  <View className="flex-row items-center gap-1">
                    <CheckCircle2 size={11} color="#059669" />
                    <Text className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {t("profile.idCardUploaded")}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-[10px] font-medium text-neutral-400">
                    {t("profile.idCardNotUploaded")}
                  </Text>
                )}
              </View>

              {idCardBackPhotoUrl ? (
                <View className="relative h-36 w-full rounded-2xl overflow-hidden border border-neutral-border dark:border-neutral-700 bg-neutral-900">
                  <Image
                    source={{ uri: idCardBackPhotoUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                  <View className="absolute top-2.5 right-2.5 flex-row items-center gap-2">
                    <Pressable
                      onPress={handlePickIdBack}
                      disabled={isUploadingBack}
                      hitSlop={6}
                      className="flex-row items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 active:opacity-80"
                    >
                      {isUploadingBack ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <RefreshCw size={11} color="#FFFFFF" />
                      )}
                      <Text className="text-[11px] font-semibold text-white">
                        {t("profile.changePhoto")}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setIdCardBackPhotoUrl("")}
                      hitSlop={6}
                      className="h-7 w-7 items-center justify-center rounded-full bg-black/70 active:opacity-80"
                      accessibilityLabel="Remove back photo"
                    >
                      <Trash2 size={12} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={handlePickIdBack}
                  disabled={isUploadingBack}
                  className="h-32 w-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 active:opacity-75"
                >
                  {isUploadingBack ? (
                    <View className="items-center gap-2">
                      <ActivityIndicator size="small" color="#0B927E" />
                      <Text variant="muted" className="text-xs">
                        {t("profile.updatingProfile")}
                      </Text>
                    </View>
                  ) : (
                    <View className="items-center gap-1.5">
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-light/70 dark:bg-brand/20">
                        <Camera size={18} color="#0B927E" />
                      </View>
                      <Text className="text-xs font-semibold text-brand">
                        {t("profile.uploadPhoto")}
                      </Text>
                    </View>
                  )}
                </Pressable>
              )}
            </View>
          </View>

          {/* Unified Save Changes Button */}
          <Pressable
            onPress={handleSaveProfile}
            disabled={isUpdatingProfile}
            className="mt-2 flex-row items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 shadow-sm active:opacity-90"
          >
            {isUpdatingProfile ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <CheckCircle2 size={16} color="#FFFFFF" />
            )}
            <Text className="text-xs font-bold text-white">
              {isUpdatingProfile ? t("profile.updatingProfile") : t("profile.saveProfileBtn")}
            </Text>
          </Pressable>
        </View>

        {/* Section 5: Đổi mật khẩu */}
        <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm gap-4">
          <View className="flex-row items-center gap-2 border-b border-neutral-border/60 dark:border-neutral-800 pb-3">
            <KeyRound size={18} color="#FF702E" />
            <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
              {t("profile.changePasswordSection")}
            </Text>
          </View>

          {/* Current Password */}
          <View className="gap-1.5">
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
              {t("profile.currentPassword")}
            </Text>
            <View className="flex-row items-center rounded-2xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 px-3.5 py-2.5">
              <Lock size={16} color="#647B80" />
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                placeholder={t("profile.currentPasswordPlaceholder")}
                placeholderTextColor="#8C9E9E"
                className="ml-2.5 flex-1 py-0 text-xs text-neutral-dark dark:text-neutral-100"
              />
              <Pressable onPress={() => setShowCurrentPassword(!showCurrentPassword)} hitSlop={8}>
                {showCurrentPassword ? (
                  <EyeOff size={16} color="#647B80" />
                ) : (
                  <Eye size={16} color="#647B80" />
                )}
              </Pressable>
            </View>
          </View>

          {/* New Password */}
          <View className="gap-1.5">
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
              {t("profile.newPassword")}
            </Text>
            <View className="flex-row items-center rounded-2xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 px-3.5 py-2.5">
              <Lock size={16} color="#647B80" />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                placeholder={t("profile.newPasswordPlaceholder")}
                placeholderTextColor="#8C9E9E"
                className="ml-2.5 flex-1 py-0 text-xs text-neutral-dark dark:text-neutral-100"
              />
              <Pressable onPress={() => setShowNewPassword(!showNewPassword)} hitSlop={8}>
                {showNewPassword ? (
                  <EyeOff size={16} color="#647B80" />
                ) : (
                  <Eye size={16} color="#647B80" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Confirm New Password */}
          <View className="gap-1.5">
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
              {t("profile.confirmNewPassword")}
            </Text>
            <View className="flex-row items-center rounded-2xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 px-3.5 py-2.5">
              <Lock size={16} color="#647B80" />
              <TextInput
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry={!showConfirmPassword}
                placeholder={t("profile.confirmNewPasswordPlaceholder")}
                placeholderTextColor="#8C9E9E"
                className="ml-2.5 flex-1 py-0 text-xs text-neutral-dark dark:text-neutral-100"
              />
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={8}>
                {showConfirmPassword ? (
                  <EyeOff size={16} color="#647B80" />
                ) : (
                  <Eye size={16} color="#647B80" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Change Password Submit Button */}
          <Pressable
            onPress={handleChangePassword}
            disabled={isChangingPassword}
            className="mt-2 flex-row items-center justify-center gap-2 rounded-2xl bg-cta py-3.5 shadow-sm active:opacity-90"
          >
            {isChangingPassword ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ShieldCheck size={16} color="#FFFFFF" />
            )}
            <Text className="text-xs font-bold text-white">
              {isChangingPassword ? t("profile.changingPassword") : t("profile.changePasswordBtn")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
