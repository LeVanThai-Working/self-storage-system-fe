import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, X } from "lucide-react-native";
import type { CloudinaryFolderEnum } from "@self-storage-system-fe/shared";
import { Text } from "./text";
import { cn } from "@/lib/utils";
import { uploadImageToCloudinary } from "@/lib/upload/cloudinary";
import { useTranslation } from "@/stores/language.store";
import { toast } from "@/stores/toast.store";

interface ImagePickerFieldProps {
  /** Uploaded image URLs. */
  value: string[];
  onChange: (urls: string[]) => void;
  folder: CloudinaryFolderEnum;
  max?: number;
  disabled?: boolean;
  /** Thumbnail size in px. */
  size?: number;
  className?: string;
}

/** Row of uploaded thumbnails plus an "add photo" tile (camera or library → Cloudinary). */
export function ImagePickerField({
  value,
  onChange,
  folder,
  max = 5,
  disabled = false,
  size = 72,
  className,
}: ImagePickerFieldProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const canAdd = !disabled && !uploading && value.length < max;

  const pick = async (source: "camera" | "library") => {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.warning(t("media.permissionDenied"));
      return;
    }

    const remaining = max - value.length;
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.7,
            allowsMultipleSelection: remaining > 1,
            selectionLimit: remaining,
          });
    if (result.canceled || result.assets.length === 0) return;

    setUploading(true);
    try {
      const urls = await Promise.all(
        result.assets
          .slice(0, remaining)
          .map((asset) =>
            uploadImageToCloudinary(
              { uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType },
              folder
            )
          )
      );
      onChange([...value, ...urls]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("media.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = () => {
    Alert.alert(t("media.addPhoto"), undefined, [
      { text: t("media.takePhoto"), onPress: () => void pick("camera") },
      { text: t("media.chooseFromLibrary"), onPress: () => void pick("library") },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const handleRemove = (url: string) => {
    if (disabled || uploading) return;
    onChange(value.filter((item) => item !== url));
  };

  return (
    <View className={cn("gap-1.5", className)}>
      <View className="flex-row flex-wrap gap-2">
        {value.map((url) => (
          <View key={url} style={{ width: size, height: size }}>
            <Image
              source={{ uri: url }}
              style={{ width: size, height: size }}
              className="rounded-xl bg-neutral-100 dark:bg-neutral-800"
            />
            {!disabled ? (
              <Pressable
                onPress={() => handleRemove(url)}
                hitSlop={6}
                className="absolute -right-1.5 -top-1.5 h-5 w-5 items-center justify-center rounded-full border border-neutral-border bg-white dark:border-neutral-700 dark:bg-neutral-900"
              >
                <X size={11} color="#647B80" />
              </Pressable>
            ) : null}
          </View>
        ))}

        {value.length < max ? (
          <Pressable
            onPress={handleAdd}
            disabled={!canAdd}
            style={{ width: size, height: size }}
            className={cn(
              "items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-brand/40 bg-brand-light/30 active:opacity-70",
              !canAdd && "opacity-50"
            )}
          >
            {uploading ? (
              <ActivityIndicator color="#0B927E" />
            ) : (
              <>
                <Camera size={20} color="#0B927E" />
                <Text className="text-[10px] font-bold text-brand">{t("media.addPhoto")}</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
      <Text variant="muted" className="text-[11px]">
        {t("media.count", { count: value.length, max })}
      </Text>
    </View>
  );
}
