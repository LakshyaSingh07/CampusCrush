import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { makeStyles } from "../theme";

function Dot({ delay }) {
  const styles = useStyles();
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(-4, { duration: 260 }), withTiming(0, { duration: 260 })), -1)
    );
  }, [y, delay]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[styles.dot, style]} />;
}

// Three bouncing dots in a chat bubble
export default function TypingDots() {
  const styles = useStyles();
  return (
    <View style={styles.bubble} accessibilityLabel="Typing">
      <Dot delay={0} />
      <Dot delay={130} />
      <Dot delay={260} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  bubble: {
    flexDirection: "row",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: t.colors.surface,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: t.colors.textMuted,
  },
}));
