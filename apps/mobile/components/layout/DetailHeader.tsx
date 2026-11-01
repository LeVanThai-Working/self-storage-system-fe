import React from "react";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { Text } from "@/components/ui/text";

export interface DetailHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  children?: React.ReactNode;
}

export function DetailHeader({
  title,
  subtitle,
  onBack,
  rightElement,
  children,
}: DetailHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: Math.max(insets.top, 8) + 6 }}
      className="bg-brand px-4 pb-3 shadow-sm"
    >
      <View className="flex-row items-center justify-between min-h-[36px]">
        {/* Back Button */}
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            className="items-center justify-center p-1.5 -ml-1.5 rounded-full active:opacity-75"
            accessibilityLabel="Back"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View className="w-6" />
        )}

        {/* Title and optional subtitle */}
        <View className="flex-1 px-2.5">
          {typeof title === "string" ? (
            <Text numberOfLines={1} className="text-base font-bold text-white leading-tight">
              {title}
            </Text>
          ) : (
            title
          )}

          {subtitle ? (
            typeof subtitle === "string" ? (
              <Text numberOfLines={1} className="text-xs text-white/80 mt-0.5 leading-none">
                {subtitle}
              </Text>
            ) : (
              subtitle
            )
          ) : null}
        </View>

        {/* Right Element or balancing spacer */}
        {rightElement ? (
          <View className="flex-row items-center justify-end">{rightElement}</View>
        ) : (
          <View className="w-6" />
        )}
      </View>

      {children}
    </View>
  );
}
