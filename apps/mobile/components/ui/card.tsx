import { View, Text, type ViewProps, type TextProps } from "react-native";
import { cn } from "@/lib/utils";

// ── Card ──────────────────────────────────────────────────────────────
function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn("rounded-lg border border-border bg-card p-4 shadow-sm", className)}
      {...props}
    />
  );
}

// ── CardHeader ────────────────────────────────────────────────────────
function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn("mb-3 flex-col gap-1.5", className)} {...props} />;
}

// ── CardTitle ─────────────────────────────────────────────────────────
function CardTitle({ className, ...props }: TextProps) {
  return (
    <Text
      className={cn(
        "text-lg font-semibold leading-tight tracking-tight text-neutral-dark",
        className
      )}
      {...props}
    />
  );
}

// ── CardDescription ───────────────────────────────────────────────────
function CardDescription({ className, ...props }: TextProps) {
  return <Text className={cn("text-sm text-neutral-muted", className)} {...props} />;
}

// ── CardContent ───────────────────────────────────────────────────────
function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn("", className)} {...props} />;
}

// ── CardFooter ────────────────────────────────────────────────────────
function CardFooter({ className, ...props }: ViewProps) {
  return (
    <View className={cn("mt-4 flex-row items-center justify-between", className)} {...props} />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
