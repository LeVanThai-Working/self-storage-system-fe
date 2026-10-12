import React, { useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Bell, Menu, Search, X } from "lucide-react-native";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { SettingsModal } from "@/features/auth/components/SettingsModal";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { useExploreSearchStore } from "../stores/exploreSearch.store";

interface CustomerTabHeaderProps {
  isHome?: boolean;
}

function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return "KH";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function CustomerTabHeader({ isHome = false }: CustomerTabHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuthStore();
  const { search, setSearch } = useExploreSearchStore();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const customerName = user?.name || t("settings.roleCustomer");
  const initials = getInitials(user?.name);

  const handleSearchSubmit = () => {
    if (!isHome) {
      router.push("/(tabs)" as any);
    }
  };

  return (
    <View
      style={{ paddingTop: Math.max(insets.top, 8) + 6 }}
      className="bg-brand px-4 pb-3 shadow-sm"
    >
      {/* Section 1 (Chỉ hiển thị ở trang Home): Avatar + Tên khách hàng (trái) | Thông báo + Icon 3 gạch (phải) */}
      {isHome && (
        <View className="mb-2.5 flex-row items-center justify-between">
          {/* Tay trái: Avatar + Tên khách hàng */}
          <View className="flex-1 flex-row items-center gap-2.5 pr-3">
            <Avatar size="sm" className="border border-white/40 bg-brand-light">
              <AvatarFallback label={initials} size="sm" />
            </Avatar>
            <Text numberOfLines={1} className="flex-1 text-sm font-bold text-white">
              {customerName}
            </Text>
          </View>

          {/* Tay phải: Cụm icon thông báo và icon 3 gạch (thay thế cho toggle setting) */}
          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={() => toast.info(t("storageExplore.noNewNotifications"))}
              hitSlop={8}
              className="relative h-8 w-8 items-center justify-center rounded-full active:bg-white/15"
              accessibilityLabel="Notifications"
            >
              <Bell size={19} color="#FFFFFF" />
              <View className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cta" />
            </Pressable>

            <Pressable
              onPress={() => setSettingsVisible(true)}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full active:bg-white/15"
              accessibilityLabel="Open settings menu"
            >
              <Menu size={21} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Section 2 (Hiển thị ở tất cả các tab): Thanh search gọn nhẹ gắn trên Header */}
      <View className="h-9 w-full flex-row items-center rounded-xl bg-white dark:bg-neutral-900 px-3">
        <Search size={15} color="#0B927E" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
          placeholder={t("storageExplore.shortSearchPlaceholder")}
          placeholderTextColor="#8C9E9E"
          className="ml-2 flex-1 py-0 text-xs text-neutral-dark dark:text-neutral-100"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <X size={14} color="#647B80" />
          </Pressable>
        )}
      </View>

      {isHome && (
        <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      )}
    </View>
  );
}
