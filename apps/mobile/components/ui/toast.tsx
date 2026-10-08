import React, { useEffect } from "react";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react-native";
import { useToastStore, type ToastType } from "@/stores/toast.store";
import { Text } from "./text";

export function GlobalToast() {
  const insets = useSafeAreaInsets();
  const { currentToast, hideToast } = useToastStore();

  useEffect(() => {
    if (!currentToast) return;

    const timeoutMs = currentToast.duration ?? 3500;
    const timer = setTimeout(() => {
      hideToast();
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [currentToast, hideToast]);

  if (!currentToast) return null;

  const renderIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={20} color="#10B981" />;
      case "error":
        return <AlertCircle size={20} color="#EF4444" />;
      case "warning":
        return <AlertTriangle size={20} color="#F59E0B" />;
      case "info":
      default:
        return <Info size={20} color="#0EA5E9" />;
    }
  };

  const getStyleConfig = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          container:
            "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/90 dark:border-emerald-800",
          text: "text-emerald-900 dark:text-emerald-200",
        };
      case "error":
        return {
          container: "border-red-300 bg-red-50 dark:bg-red-950/90 dark:border-red-800",
          text: "text-red-900 dark:text-red-200",
        };
      case "warning":
        return {
          container: "border-amber-300 bg-amber-50 dark:bg-amber-950/90 dark:border-amber-800",
          text: "text-amber-900 dark:text-amber-200",
        };
      case "info":
      default:
        return {
          container: "border-sky-300 bg-sky-50 dark:bg-sky-950/90 dark:border-sky-800",
          text: "text-sky-900 dark:text-sky-200",
        };
    }
  };

  const styles = getStyleConfig(currentToast.type);

  return (
    <View
      pointerEvents="box-none"
      style={{ top: Math.max(insets.top, 16) }}
      className="absolute left-0 right-0 z-50 items-center px-4"
    >
      <View
        className={`w-full max-w-md flex-row items-center gap-3 rounded-2xl border p-4 shadow-lg ${styles.container}`}
      >
        <View className="flex-shrink-0">{renderIcon(currentToast.type)}</View>

        <View className="flex-1">
          {currentToast.title && (
            <Text className={`text-sm font-bold ${styles.text}`}>{currentToast.title}</Text>
          )}
          <Text className={`text-xs font-medium leading-4 ${styles.text}`}>
            {currentToast.message}
          </Text>
        </View>

        <Pressable onPress={hideToast} className="p-1 rounded-full active:opacity-60" hitSlop={8}>
          <X size={16} color="#647B80" />
        </Pressable>
      </View>
    </View>
  );
}
