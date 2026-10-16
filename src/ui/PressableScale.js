import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { haptics } from "./haptics";
import { SPRING } from "./motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Pressable that springs down slightly while pressed, with optional haptics
// (haptic: "light" | "medium" | "select" | ...).
export default function PressableScale({
  scaleTo = 0.96,
  haptic,
  onPress,
  disabled,
  style,
  children,
  ...rest
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(scaleTo, SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING);
      }}
      onPress={(e) => {
        if (haptic) haptics[haptic]?.();
        onPress?.(e);
      }}
      disabled={disabled}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
