import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import type { ViewProps } from "react-native";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type SkeletonProps = ViewProps & {
  /** Animate pulse or not */
  animate?: boolean;
};

function Skeleton({ className, animate = true, style, ...props }: SkeletonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!animate) return;

    opacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1 // infinite
    );

    return () => {
      cancelAnimation(opacity);
    };
  }, [animate, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[animatedStyle, style]}
      className={cn("rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
export type { SkeletonProps };
