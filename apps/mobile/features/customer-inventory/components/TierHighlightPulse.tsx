import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";

const PULSE_DURATION_MS = 500;
/** 3 blinks of ~1s each, then the border stays visible. */
const PULSE_REPEAT = 3;

/** Orange border that blinks over a located tier (absolute overlay, does not capture touches). */
export function TierHighlightPulse() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: PULSE_DURATION_MS }),
        withTiming(1, { duration: PULSE_DURATION_MS })
      ),
      PULSE_REPEAT
    );

    return () => {
      cancelAnimation(opacity);
    };
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={animatedStyle}
      className="absolute -inset-0.5 rounded-2xl border-2 border-cta"
    />
  );
}
