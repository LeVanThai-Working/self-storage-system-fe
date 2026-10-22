import React from "react";
import { View, Image } from "react-native";
import { Package } from "lucide-react-native";

const SIZE = {
  sm: { box: "h-10 w-10", icon: 16 },
  md: { box: "h-14 w-14", icon: 22 },
};

interface SkuThumbProps {
  imageUrl?: string | null;
  size?: keyof typeof SIZE;
}

/** SKU picture, or a package icon when the SKU has no image. */
export function SkuThumb({ imageUrl, size = "md" }: SkuThumbProps) {
  const style = SIZE[size];

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        className={`${style.box} rounded-xl bg-neutral-100 dark:bg-neutral-800`}
      />
    );
  }

  return (
    <View
      className={`${style.box} items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800`}
    >
      <Package size={style.icon} color="#647B80" />
    </View>
  );
}
