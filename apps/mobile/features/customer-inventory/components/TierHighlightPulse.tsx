import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";

const PULSE_DURATION_MS = 600;

interface TierHighlightPulseProps {
  /** Corner radius class matching the highlighted element. */
  className?: string;
}

/**
 * Thick orange ring that keeps pulsing (fade + slight zoom) over a located element until the
 * highlight is cleared. Absolute overlay, does not capture touches.
 */
export function TierHighlightPulse({ className = "rounded-2xl" }: TierHighlightPulseProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: PULSE_DURATION_MS }),
        withTiming(0, { duration: PULSE_DURATION_MS })
      ),
      -1
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + progress.value * 0.55,
    transform: [{ scale: 1 + progress.value * 0.03 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={animatedStyle}
      className={`absolute -inset-1 border-[3px] border-cta bg-cta/10 ${className}`}
    />
  );
}
