import { useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const COLORS = ["#FFC83D", "#FF7A59", "#FFFFFF", "#FFD866", "#FF9EB5", "#7BD389"];

function Piece({ originX, originY, dx, rise, fall, rotate, delay, size, color, duration }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
  }, [progress, delay, duration]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    // Shoot up, then fall: a simple parabola
    const y = -rise * 4 * p * (1 - p) + fall * p * p;
    return {
      opacity: p < 0.85 ? 1 : (1 - p) / 0.15,
      transform: [
        { translateX: originX + dx * p },
        { translateY: originY + y },
        { rotate: `${rotate * p}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        { width: size, height: size * 0.45, backgroundColor: color, borderRadius: size * 0.12 },
        style,
      ]}
    />
  );
}

// One-shot confetti burst from the middle of the screen. Remount (change
// `key`) to play it again.
export default function Confetti({ count = 48 }) {
  const { width, height } = useWindowDimensions();

  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        originX: width / 2,
        originY: height * 0.42,
        dx: (Math.random() - 0.5) * width * 1.2,
        rise: 160 + Math.random() * 260,
        fall: height * (0.35 + Math.random() * 0.3),
        rotate: (Math.random() - 0.5) * 900,
        delay: Math.random() * 180,
        size: 8 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        duration: 1500 + Math.random() * 900,
      })),
    [count, width, height]
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map(({ id, ...p }) => (
        <Piece key={id} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
