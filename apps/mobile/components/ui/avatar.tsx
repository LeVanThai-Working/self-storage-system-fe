import { View, Image, Text, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

// ── Avatar (container) ───────────────────────────────────────────────
type AvatarProps = ViewProps & {
  size?: "sm" | "default" | "lg" | "xl";
};

const sizeMap = {
  sm: "h-8 w-8",
  default: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const textSizeMap = {
  sm: "text-xs",
  default: "text-sm",
  lg: "text-base",
  xl: "text-xl",
};

function Avatar({ className, size = "default", ...props }: AvatarProps) {
  return (
    <View
      className={cn("relative overflow-hidden rounded-full bg-muted", sizeMap[size], className)}
      {...props}
    />
  );
}

// ── AvatarImage ──────────────────────────────────────────────────────
type AvatarImageProps = {
  src: string;
  alt?: string;
  className?: string;
};

function AvatarImage({ src, alt, className }: AvatarImageProps) {
  return (
    <Image
      source={{ uri: src }}
      accessibilityLabel={alt}
      className={cn("h-full w-full", className)}
      resizeMode="cover"
    />
  );
}

// ── AvatarFallback ───────────────────────────────────────────────────
type AvatarFallbackProps = ViewProps & {
  label?: string;
  size?: "sm" | "default" | "lg" | "xl";
};

function AvatarFallback({ className, label, size = "default", ...props }: AvatarFallbackProps) {
  return (
    <View
      className={cn("absolute inset-0 flex items-center justify-center bg-brand-light", className)}
      {...props}
    >
      {label ? (
        <Text className={cn("font-semibold text-brand", textSizeMap[size])}>{label}</Text>
      ) : null}
    </View>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
