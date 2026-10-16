import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../theme";

// Pulsing placeholder shown while content loads
export default function Skeleton({ width = "100%", height = 16, radius = 10, style }) {
  const t = useTheme();
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: t.colors.skeleton }, animatedStyle, style]}
    />
  );
}
